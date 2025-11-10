import { FoodRepository } from "../repositories/food.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  FoodWithCategories,
  CreateFoodRequest,
  CreateFoodData,
} from "../../../types/food.js";
import * as path from "path";
import XLSX from "xlsx";

export class FoodService {
  constructor(
    private foodRepository: FoodRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async getAllFoods(): Promise<FoodWithCategories[]> {
    return this.foodRepository.findAll();
  }

  async updateStatus(id: number, active: boolean): Promise<boolean> {
    return this.foodRepository.updateStatus(id, active);
  }

  async updateFood(
    id: number,
    data: Partial<FoodWithCategories>
  ): Promise<boolean> {
    return this.foodRepository.update(id, data);
  }

  async importFromExcel(filePath: string): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    try {
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (![".xlsx", ".xls"].includes(ext)) {
        throw new Error("File không đúng định dạng Excel (.xlsx, .xls)");
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as unknown[][];

      if (data.length < 3) {
        throw new Error("File Excel trống hoặc không có dữ liệu");
      }

      // Skip 2 header rows, process from row 3
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;

        try {
          // Skip empty rows
          if (!row || row.every((cell) => !cell)) continue;

          // Map Excel columns to food data
          const foodData = this.mapExcelRowToFood(row);

          if (foodData) {
            // Create food record
            await this.createFoodFromImport(foodData);
            imported++;
          }
        } catch (error) {
          errors.push({
            row: rowNum,
            error:
              error instanceof Error ? error.message : "Lỗi không xác định",
          });
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [
          {
            row: 0,
            error:
              error instanceof Error ? error.message : "Lỗi đọc file Excel",
          },
        ],
      };
    }
  }

  private mapExcelRowToFood(row: unknown[]): CreateFoodRequest | null {
    // Excel columns mapping based on the image:
    // A(0): Mã số, B(1): Nơi lấy mẫu, C(2): Thực phẩm, D(3): Đơn vị tính, E(4): Giá trị
    // F(5): Calo sử dụng, G(6): HH1.1 Tỉ lệ, H(7): HH1.1 BN, I(8): HH2.1 Tỉ lệ, J(9): HH2.1 BN
    // K(10): HH2.2 Tỉ lệ, L(11): HH2.2 BN, M(12): HH2.3 Tỉ lệ, N(13): HH2.3 BN
    // O(14): HH3.1 Tỉ lệ, P(15): HH3.1 BN, Q(16): TL%, R(17): Nơi xuất, S(18): Loại hình
    // T(19): Ngày áp dụng, U(20): Con số dương (active)

    const id = this.getCellValue(row[0]);
    const originName = this.getCellValue(row[1]);
    const foodName = this.getCellValue(row[2]);
    const unit = this.getCellValue(row[3]);
    const caloriePerUnit = this.parseNumber(row[4]);

    // Validate required fields
    if (!id) {
      throw new Error("Thiếu mã số thực phẩm");
    }
    if (!foodName) {
      throw new Error("Thiếu tên thực phẩm");
    }
    if (!unit) {
      throw new Error("Thiếu đơn vị tính");
    }
    if (caloriePerUnit === null) {
      throw new Error("Giá trị calorie không hợp lệ");
    }

    return {
      foodId: String(id),
      originName: originName || "",
      foodName: foodName,
      unit: unit,
      caloriePerUnit: caloriePerUnit,
      calorieUsage: this.getCellValue(row[5]),
      hh11Ratio: this.getCellValue(row[6]),
      hh11Patient: this.getCellValue(row[7]),
      hh21Ratio: this.getCellValue(row[8]),
      hh21Patient: this.getCellValue(row[9]),
      hh22Ratio: this.getCellValue(row[10]),
      hh22Patient: this.getCellValue(row[11]),
      hh23Ratio: this.getCellValue(row[12]),
      hh23Patient: this.getCellValue(row[13]),
      hh31Ratio: this.getCellValue(row[14]),
      hh31Patient: this.getCellValue(row[15]),
      lossRatio: this.getCellValue(row[16]),
      destinationName: this.getCellValue(row[17]) || "",
      insuranceTypeName: this.getCellValue(row[18]) || "",
      applyDate: this.getCellValue(row[19]),
      active: this.parseBoolean(row[20]),
    };
  }

  private getCellValue(cell: unknown): string | null {
    if (cell === undefined || cell === null || cell === "") {
      return null;
    }
    const trimmed = String(cell).trim();
    return trimmed === "" ? null : trimmed;
  }

  private parseNumber(cell: unknown): number | null {
    if (cell === undefined || cell === null || cell === "") {
      return null;
    }

    const num = Number(cell);
    return isNaN(num) ? null : num;
  }

  private parseBoolean(cell: unknown): boolean {
    if (cell === undefined || cell === null || cell === "") {
      return true; // Default active
    }

    const value = String(cell).toLowerCase().trim();
    return !["false", "0", "no", "inactive", "ngưng"].includes(value);
  }

  private async createFoodFromImport(data: CreateFoodRequest): Promise<void> {
    try {
      // Find or create category IDs - chỉ khi có dữ liệu
      const originId =
        data.originName && data.originName.trim()
          ? this.categoryRepository.findOrCreateOrigin(data.originName)
          : 0;
      const foodNameId = this.categoryRepository.findOrCreateFoodName(
        data.foodName
      );
      const unitId = this.categoryRepository.findOrCreateUnit(data.unit);
      const destinationId =
        data.destinationName && data.destinationName.trim()
          ? this.categoryRepository.findOrCreateDestination(
              data.destinationName
            )
          : 0;
      const insuranceTypeId =
        data.insuranceTypeName && data.insuranceTypeName.trim()
          ? this.categoryRepository.findOrCreateInsuranceType(
              data.insuranceTypeName
            )
          : 0;

      // Create the food record - sử dụng CreateFoodData interface
      const createData: CreateFoodData = {
        foodId: data.foodId,
        originId: originId,
        foodNameId: foodNameId,
        unitId: unitId,
        caloriePerUnit: data.caloriePerUnit,
        calorieUsage: data.calorieUsage,
        hh11Ratio: data.hh11Ratio,
        hh11Patient: data.hh11Patient,
        hh21Ratio: data.hh21Ratio,
        hh21Patient: data.hh21Patient,
        hh22Ratio: data.hh22Ratio,
        hh22Patient: data.hh22Patient,
        hh23Ratio: data.hh23Ratio,
        hh23Patient: data.hh23Patient,
        hh31Ratio: data.hh31Ratio,
        hh31Patient: data.hh31Patient,
        lossRatio: data.lossRatio || "",
        destinationId: destinationId,
        insuranceTypeId: insuranceTypeId,
        applyDate: data.applyDate,
        active:
          data.active !== undefined && data.active !== null
            ? data.active
            : null,
      };

      const foodId = this.foodRepository.create(createData);

      console.log(`✅ Created food record with ID: ${foodId}`);
    } catch (error) {
      console.error("Error creating food from import:", error);
      throw error;
    }
  }
}
