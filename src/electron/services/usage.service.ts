import UsageRepository from "../repositories/usage.repository.js";
import { databaseManager } from "../database/database-manager.js";
import * as path from "path";
import XLSX from "xlsx";
import { app } from "electron";
import {
  UsageCalculationRequest,
  UsageCalculationResult,
  UsageCalculationRow,
  UsageNotFoundItem,
  SaveUsageRequest,
  SaveUsageResponse,
} from "../../../types/usage.js";

class UsageService {
  private usageRepository: UsageRepository;

  constructor(usageRepository: UsageRepository) {
    this.usageRepository = usageRepository;
  }

  async calculateUsage(
    request: UsageCalculationRequest
  ): Promise<UsageCalculationResult> {
    try {
      console.log(
        `🔢 Calculating usage for ${request.inputData.length} items for ${request.selectedMonthYear}`
      );

      const result = this.usageRepository.calculateUsageData(request);

      // Export not found items to Excel if any
      if (result.notFoundItems.length > 0) {
        const notFoundFilePath = await this.exportNotFoundItems(
          result.notFoundItems,
          request.selectedMonthYear
        );
        result.notFoundFilePath = notFoundFilePath;
      }

      console.log(
        `✅ Usage calculation complete: ${result.calculatedData.length} calculated, ${result.notFoundItems.length} not found`
      );
      return result;
    } catch (error) {
      console.error("❌ Error calculating usage:", error);
      throw error;
    }
  }

  async exportNotFoundItems(
    items: UsageNotFoundItem[],
    monthYear: string
  ): Promise<string> {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Prepare data for export
      const exportData = items.map((item) => ({
        "Mã số": item.foodId,
        "Nơi lấy mẫu": item.originName,
        "Thực phẩm": item.foodName,
        "Đơn vị tính": item.unit,
        "Giá trị": item.value,
        "Lý do không tìm thấy": item.reason,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Không tìm thấy");

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `KhongTimThay_${monthYear}_${timestamp}.xlsx`;

      // Get downloads folder path
      const downloadsPath = path.join(app.getPath("downloads"), fileName);

      // Write file
      XLSX.writeFile(wb, downloadsPath);

      console.log(
        `📄 Exported ${items.length} not found items to: ${downloadsPath}`
      );
      return downloadsPath;
    } catch (error) {
      console.error("❌ Error exporting not found items:", error);
      throw error;
    }
  }

  // Parse Excel file to extract usage input data
  async parseExcelFile(filePath: string): Promise<any[]> {
    try {
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      // Map to our data structure (assuming Excel columns match our interface)
      const parsedData = rawData.map((row: any) => {
        const foodId = row["Mã số"] || row["A"] || "";
        const originName = row["Nơi lấy mẫu"] || row["B"] || "";
        const foodName = row["Thực phẩm"] || row["C"] || "";
        const unit = row["Đơn vị tính"] || row["D"] || "";
        const value = parseFloat(row["Giá trị"] || row["E"] || 0);
        const quantity = parseFloat(row["Số lượng"] || row["G"] || 0);

        return {
          foodId,
          originName,
          foodName,
          unit,
          value,
          monthYear: row["Ngày tháng"] || row["F"] || "",
          quantity,
          totalCalories: quantity * value, // Tính tự động: Số lượng × Giá trị
          hh31Patient: row["HH 3.1"] || row["I"] || "", // Cột I trong Excel
          destinationName: row["Nơi xuất"] || row["J"] || "", // Cột J trong Excel
        };
      });

      // Remove first item if needed (in case there's still a header row)
      const finalData = parsedData.slice(1);

      console.log(
        `📊 Parsed ${finalData.length} rows from Excel file: ${filePath}`
      );

      // Validate each row
      const validatedData = await this.validateUsageInputData(finalData);
      return validatedData;
    } catch (error) {
      console.error("❌ Error parsing Excel file:", error);
      throw error;
    }
  }

  // Validate usage input data by checking against database
  async validateUsageInputData(inputData: any[]): Promise<any[]> {
    const db = databaseManager.getConnection();

    return inputData.map((row) => {
      let hasError = false;
      let errorMessage = "";

      // Find matching food in database
      const foodQuery = `
        SELECT 
          f.id,
          f.hh_3_1_patient,
          d.name as destination_name,
          o.name as origin_name,
          fn.name as food_name,
          u.name as unit_name
        FROM foods f
        LEFT JOIN destinations d ON f.destination_id = d.id
        LEFT JOIN origins o ON f.origin_id = o.id
        LEFT JOIN food_names fn ON f.food_name_id = fn.id
        LEFT JOIN units u ON f.unit_id = u.id
        WHERE f.food_id = ?
          AND f.active = 1
      `;

      const foodRecord = db
        .prepare(foodQuery)
        .get(row.foodId) as
        | {
            id: number;
            hh_3_1_patient: string;
            destination_name: string;
            origin_name: string;
            food_name: string;
            unit_name: string;
          }
        | undefined;

      if (!foodRecord) {
        hasError = true;
        errorMessage = "Không tìm thấy thông tin thực phẩm trong cơ sở dữ liệu.";
      }

      return {
        ...row,
        hasError,
        errorMessage,
      };
    });
  }

  async exportToExcel(
    data: any[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Prepare data for export with Vietnamese headers
      const exportData = data.map((item, index) => ({
        STT: index + 1,
        "Mã số": item.foodId,
        "Nơi lấy mẫu": item.originName,
        "Thực phẩm": item.foodName,
        "Đơn vị tính": item.unit,
        "Giá trị": item.value,
        "Số lượng": item.quantity,
        "Ngày tháng": item.monthYear || "",
        "Tổng Calo": item.totalCalories,
        "Calo sử dụng": item.usedCalories,
        "HH 1.1 - Tỉ lệ": item.hh11Ratio || "",
        "HH 1.1 - Calo": item.hh11Calories || "",
        "HH 1.1 - Người lấy mẫu": item.hh11Patient || "",
        "HH 2.1 - Tỉ lệ": item.hh21Ratio || "",
        "HH 2.1 - Calo": item.hh21Calories || "",
        "HH 2.1 - Người lấy mẫu": item.hh21Patient || "",
        "HH 2.2 - Tỉ lệ": item.hh22Ratio || "",
        "HH 2.2 - Calo": item.hh22Calories || "",
        "HH 2.2 - Người lấy mẫu": item.hh22Patient || "",
        "HH 2.3 - Tỉ lệ": item.hh23Ratio || "",
        "HH 2.3 - Calo": item.hh23Calories || "",
        "HH 2.3 - Người lấy mẫu": item.hh23Patient || "",
        "HH 3.1 - Tỉ lệ": item.hh31Ratio || "",
        "HH 3.1 - Calo": item.hh31Calories || "",
        "HH 3.1 - Người lấy mẫu": item.hh31Patient || "",
        "Tỉ lệ": item.lossRatio || "",
        "Calo còn lại": item.remainingCalories,
        "Nơi xuất": item.destinationName || "",
        "Loại hình": item.insuranceTypeName || "",
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const cols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
      ws["!cols"] = cols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Kết quả tính toán");

      // Write file
      XLSX.writeFile(wb, filePath);

      console.log(`📄 Exported ${data.length} rows to: ${filePath}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error exporting to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async saveUsageRecords(
    request: SaveUsageRequest
  ): Promise<SaveUsageResponse> {
    try {
      const db = databaseManager.getConnection();

      // Use transaction to ensure data consistency
      const transaction = db.transaction(() => {
        // Delete existing records for the same import month/year to avoid duplicates
        const deleteStmt = db.prepare(
          "DELETE FROM usage_records WHERE import_month_year = ?"
        );
        const deleteResult = deleteStmt.run(request.import_month_year);
        console.log(
          `🗑️ Deleted ${deleteResult.changes} existing records for ${request.import_month_year}`
        );

        // Insert new records
        const insertStmt = db.prepare(`
          INSERT INTO usage_records (food_record_id, sample_date, quantity, import_month_year)
          VALUES (?, ?, ?, ?)
        `);

        let saved_count = 0;
        for (const record of request.records) {
          try {
            insertStmt.run(
              record.id, // food_record_id (database ID từ calculation result)
              record.monthYear || "", // sample_date from Excel
              record.quantity, // quantity
              request.import_month_year // import month/year
            );
            saved_count++;
          } catch (error) {
            console.error("Error inserting record:", record, error);
            // Continue with other records instead of failing completely
          }
        }

        return saved_count;
      });

      const saved_count = transaction();

      console.log(
        `💾 Saved ${saved_count} usage records for import month: ${request.import_month_year}`
      );

      return {
        success: true,
        saved_count,
      };
    } catch (error) {
      console.error("❌ Error saving usage records:", error);
      return {
        success: false,
        saved_count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getUsageHistory(importMonthYear: string): Promise<{
    success: boolean;
    data: UsageCalculationRow[];
    error?: string;
  }> {
    try {
      const db = databaseManager.getConnection();

      // Query usage records with food information (using proper joins like FoodRepository)
      const query = `
        SELECT 
          ur.*,
          f.id,
          f.food_id as foodId,
          f.calorie_per_unit as value,
          f.calorie_usage as calorieUsage,
          f.hh_1_1_ratio as hh11Ratio,
          f.hh_1_1_patient as hh11Patient,
          f.hh_2_1_ratio as hh21Ratio,
          f.hh_2_1_patient as hh21Patient,
          f.hh_2_2_ratio as hh22Ratio,
          f.hh_2_2_patient as hh22Patient,
          f.hh_2_3_ratio as hh23Ratio,
          f.hh_2_3_patient as hh23Patient,
          f.hh_3_1_ratio as hh31Ratio,
          f.hh_3_1_patient as hh31Patient,
          f.loss_ratio as lossRatio,
          f.apply_date as applyDate,
          f.active,
          o.name as originName,
          fn.name as foodName,
          u.name as unit,
          d.name as destinationName,
          it.name as insuranceTypeName
        FROM usage_records ur
        JOIN foods f ON ur.food_record_id = f.id
        LEFT JOIN origins o ON f.origin_id = o.id
        LEFT JOIN food_names fn ON f.food_name_id = fn.id
        LEFT JOIN units u ON f.unit_id = u.id
        LEFT JOIN destinations d ON f.destination_id = d.id
        LEFT JOIN insurance_types it ON f.insurance_type_id = it.id
        WHERE ur.import_month_year = ?
        ORDER BY ur.created_at DESC
      `;

      const records = db.prepare(query).all(importMonthYear);

      // Transform database records to UsageCalculationRow format
      const usageData: UsageCalculationRow[] = records.map((record: any) => {
        const totalCalories = record.value * record.quantity;

        // Calculate HH calories (using correct column names)
        const hh11Calories = record.hh11Ratio
          ? Math.round(
              parseFloat(record.hh11Ratio) * record.value * record.quantity
            )
          : null;
        const hh21Calories = record.hh21Ratio
          ? Math.round(
              parseFloat(record.hh21Ratio) * record.value * record.quantity
            )
          : null;
        const hh22Calories = record.hh22Ratio
          ? Math.round(
              parseFloat(record.hh22Ratio) * record.value * record.quantity
            )
          : null;
        const hh23Calories = record.hh23Ratio
          ? Math.round(
              parseFloat(record.hh23Ratio) * record.value * record.quantity
            )
          : null;
        const hh31Calories = record.hh31Ratio
          ? Math.round(
              parseFloat(record.hh31Ratio) * record.value * record.quantity
            )
          : null;

        // Calculate total used calories
        // If < 1 (percentage) → multiply with totalCalories, if >= 1 (absolute) → multiply with quantity
        let totalUsedCalories = 0;
        if (record.calorieUsage) {
          const usageValue = parseFloat(String(record.calorieUsage));
          if (!isNaN(usageValue)) {
            totalUsedCalories = usageValue < 1 ? 
              Math.round(usageValue * totalCalories) : 
              Math.round(usageValue * record.quantity);
          }
        }

        // Calculate remaining calories based on loss ratio
        let remainingCalories = totalCalories;
        if (record.lossRatio) {
          const lossRatioValue = parseFloat(record.lossRatio);
          if (lossRatioValue < 1) {
            remainingCalories = Math.round(
              lossRatioValue * record.value * record.quantity
            );
          } else {
            remainingCalories = Math.round(lossRatioValue * record.quantity);
          }
        }

        return {
          id: record.food_record_id,
          foodId: record.foodId,
          originName: record.originName,
          foodName: record.foodName,
          unit: record.unit,
          value: record.value,
          monthYear: record.sample_date,
          quantity: record.quantity,
          selectedMonthYear: record.import_month_year,
          totalCalories,
          usedCalories: record.calorieUsage,
          totalUsedCalories,
          hh11Ratio: record.hh11Ratio ? parseFloat(record.hh11Ratio) : null,
          hh11Calories,
          hh11Patient: record.hh11Patient,
          hh21Ratio: record.hh21Ratio ? parseFloat(record.hh21Ratio) : null,
          hh21Calories,
          hh21Patient: record.hh21Patient,
          hh22Ratio: record.hh22Ratio ? parseFloat(record.hh22Ratio) : null,
          hh22Calories,
          hh22Patient: record.hh22Patient,
          hh23Ratio: record.hh23Ratio ? parseFloat(record.hh23Ratio) : null,
          hh23Calories,
          hh23Patient: record.hh23Patient,
          hh31Ratio: record.hh31Ratio ? parseFloat(record.hh31Ratio) : null,
          hh31Calories,
          hh31Patient: record.hh31Patient,
          lossRatio: record.lossRatio ? parseFloat(record.lossRatio) : null,
          remainingCalories,
          destinationName: record.destinationName,
          insuranceTypeName: record.insuranceTypeName,
          applyDate: record.applyDate,
          active: record.active === 1,
        };
      });

      console.log(
        `📊 Retrieved ${usageData.length} usage history records for ${importMonthYear}`
      );

      return {
        success: true,
        data: usageData,
      };
    } catch (error) {
      console.error("❌ Error getting usage history:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export { UsageService };
