import {
  GetPatientSummaryRequest,
  PatientSummaryRow,
  PatientDetailRow,
  FoodSummaryRow,
  GetFoodSummaryRequest,
  GetFoodSummaryResponse,
  GetFoodDetailResponse,
} from "../../../types/report.js";

interface GetPatientSummaryResponse {
  success: boolean;
  data: PatientSummaryRow[];
  error?: string;
}

interface GetPatientDetailResponse {
  success: boolean;
  data: PatientDetailRow[];
  error?: string;
}
import XLSX from "xlsx";
import { ReportRepository } from "../repositories/report.repository.js";

class ReportService {
  private reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }
  async getPatientSummary(
    request: GetPatientSummaryRequest
  ): Promise<GetPatientSummaryResponse> {
    try {
      const records = this.reportRepository.getUsageRecordsForSummary(request);

      // Aggregate by patient
      const patientMap = new Map<string, PatientSummaryRow>();

      for (const record of records) {
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        // Calculate totalUsedCalories as in usage.service.ts
        let totalUsedCalories = 0;
        if (record.calorieUsage) {
          const usageValue = parseFloat(String(record.calorieUsage));
          if (!isNaN(usageValue)) {
            totalUsedCalories =
              usageValue < 1
                ? Math.round(usageValue * totalCalories)
                : Math.round(usageValue * quantity);
          }
        }

        // Calculate HH calories as in usage.service.ts
        const hh11Calories = record.hh11Ratio
          ? Math.round(parseFloat(record.hh11Ratio) * record.value * quantity)
          : 0;
        const hh21Calories = record.hh21Ratio
          ? Math.round(parseFloat(record.hh21Ratio) * record.value * quantity)
          : 0;
        const hh22Calories = record.hh22Ratio
          ? Math.round(parseFloat(record.hh22Ratio) * record.value * quantity)
          : 0;
        const hh23Calories = record.hh23Ratio
          ? Math.round(parseFloat(record.hh23Ratio) * record.value * quantity)
          : 0;
        const hh31Calories = record.hh31Ratio
          ? Math.round(parseFloat(record.hh31Ratio) * record.value * quantity)
          : 0;

        // Determine patient and hhGroup
        const patientGroups = [
          {
            patient: record.hh31Patient,
            group: "HH 3.1",
            calories: hh31Calories,
          },
          {
            patient: record.hh11Patient,
            group: "HH 1.1",
            calories: hh11Calories,
          },
          {
            patient: record.hh21Patient,
            group: "HH 2.1",
            calories: hh21Calories,
          },
          {
            patient: record.hh22Patient,
            group: "HH 2.2",
            calories: hh22Calories,
          },
          {
            patient: record.hh23Patient,
            group: "HH 2.3",
            calories: hh23Calories,
          },
        ].filter((p) => p.patient);

        for (const pg of patientGroups) {
          const patient = pg.patient!;
          const hhGroup = pg.group;

          const existing = patientMap.get(patient) || {
            patient,
            totalCalories: 0,
            totalUsedCalories: 0,
            totalLoss: 0,
            hhGroup,
          };

          existing.totalCalories += totalCalories;
          existing.totalUsedCalories += totalUsedCalories;
          existing.totalLoss += pg.calories;

          patientMap.set(patient, existing);
        }
      }

      const data = Array.from(patientMap.values());

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting patient summary:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getPatientDetail(request: {
    fromMonthYear: string;
    toMonthYear: string;
    patient: string;
    hhGroup: string;
  }): Promise<GetPatientDetailResponse> {
    try {
      const records = this.reportRepository.getPatientDetailRecords(request);

      // Transform to similar format as usage calculation result
      const detailData = records.map((record: PatientDetailRow) => {
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        // Calculate used calories
        let usedCalories = 0;
        if (record.calorieUsage) {
          const usageValue = parseFloat(String(record.calorieUsage));
          if (!isNaN(usageValue)) {
            usedCalories =
              usageValue < 1
                ? Math.round(usageValue * totalCalories)
                : Math.round(usageValue * quantity);
          }
        }

        // Calculate remaining calories
        let remainingCalories = totalCalories;
        if (record.lossRatio) {
          const lossRatioValue = parseFloat(record.lossRatio);
          if (lossRatioValue < 1) {
            remainingCalories = Math.round(
              lossRatioValue * record.value * quantity
            );
          } else {
            remainingCalories = Math.round(lossRatioValue * quantity);
          }
        }

        // HH calculations
        const hh11Calories = record.hh11Ratio
          ? Math.round(parseFloat(record.hh11Ratio) * record.value * quantity)
          : undefined;
        const hh21Calories = record.hh21Ratio
          ? Math.round(parseFloat(record.hh21Ratio) * record.value * quantity)
          : undefined;
        const hh22Calories = record.hh22Ratio
          ? Math.round(parseFloat(record.hh22Ratio) * record.value * quantity)
          : undefined;
        const hh23Calories = record.hh23Ratio
          ? Math.round(parseFloat(record.hh23Ratio) * record.value * quantity)
          : undefined;
        const hh31Calories = record.hh31Ratio
          ? Math.round(parseFloat(record.hh31Ratio) * record.value * quantity)
          : undefined;

        return {
          quantity,
          value: record.value,
          calorieUsage: record.calorieUsage || "",
          foodId: record.foodId,
          originName: record.originName,
          destinationName: record.destinationName,
          insuranceTypeName: record.insuranceTypeName,
          foodName: record.foodName,
          unit: record.unit,
          monthYear: record.monthYear,
          totalCalories,
          usedCalories,
          remainingCalories,
          hh11Ratio: record.hh11Ratio || undefined,
          hh11Calories,
          hh11Patient: record.hh11Patient,
          hh21Ratio: record.hh21Ratio || undefined,
          hh21Calories,
          hh21Patient: record.hh21Patient,
          hh22Ratio: record.hh22Ratio || undefined,
          hh22Calories,
          hh22Patient: record.hh22Patient,
          hh23Ratio: record.hh23Ratio || undefined,
          hh23Calories,
          hh23Patient: record.hh23Patient,
          hh31Ratio: record.hh31Ratio || undefined,
          hh31Calories,
          hh31Patient: record.hh31Patient,
          lossRatio: record.lossRatio || undefined,
        };
      });

      return {
        success: true,
        data: detailData,
      };
    } catch (error) {
      console.error("Error getting patient detail:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportSummaryToExcel(
    data: PatientSummaryRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert data to worksheet format
      const worksheetData = data.map((row, index) => ({
        STT: index + 1,
        "Người lấy mẫu": row.patient,
        "Tổng calo": row.totalCalories,
        "Calo hao hụt": row.totalLoss,
        "Nhóm hao hụt": row.hhGroup,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo tổng quan");

      // Write file
      XLSX.writeFile(workbook, filePath);

      return { success: true };
    } catch (error) {
      console.error("Error exporting summary to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportDetailToExcel(
    data: PatientDetailRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert data to worksheet format
      const worksheetData = data.map((row, index) => {
        const baseData: any = {
          STT: index + 1,
          "Mã số": row.foodId,
          "Nơi lấy mẫu": row.originName,
          "Nơi xuất": row.destinationName || "",
          "Loại hình": row.insuranceTypeName || "",
          "Thực phẩm": row.foodName,
          "Đơn vị tính": row.unit,
          "Giá trị": row.value,
          "Số lượng": row.quantity,
          "Ngày tháng": row.monthYear,
          "Tổng Calo": row.totalCalories,
        };

        // Add HH data if available
        if (row.hh11Ratio !== undefined) {
          baseData["HH 1.1 - Tỉ lệ"] = row.hh11Ratio;
          baseData["HH 1.1 - Calo"] = row.hh11Calories;
          baseData["HH 1.1 - Người lấy mẫu"] = row.hh11Patient;
        }
        if (row.hh21Ratio !== undefined) {
          baseData["HH 2.1 - Tỉ lệ"] = row.hh21Ratio;
          baseData["HH 2.1 - Calo"] = row.hh21Calories;
          baseData["HH 2.1 - Người lấy mẫu"] = row.hh21Patient;
        }
        if (row.hh22Ratio !== undefined) {
          baseData["HH 2.2 - Tỉ lệ"] = row.hh22Ratio;
          baseData["HH 2.2 - Calo"] = row.hh22Calories;
          baseData["HH 2.2 - Người lấy mẫu"] = row.hh22Patient;
        }
        if (row.hh23Ratio !== undefined) {
          baseData["HH 2.3 - Tỉ lệ"] = row.hh23Ratio;
          baseData["HH 2.3 - Calo"] = row.hh23Calories;
          baseData["HH 2.3 - Người lấy mẫu"] = row.hh23Patient;
        }
        if (row.hh31Ratio !== undefined) {
          baseData["HH 3.1 - Tỉ lệ"] = row.hh31Ratio;
          baseData["HH 3.1 - Calo"] = row.hh31Calories;
          baseData["HH 3.1 - Người lấy mẫu"] = row.hh31Patient;
        }

        return baseData;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo chi tiết");

      // Write file
      XLSX.writeFile(workbook, filePath);

      return { success: true };
    } catch (error) {
      console.error("Error exporting detail to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getFoodSummary(
    request: GetFoodSummaryRequest
  ): Promise<GetFoodSummaryResponse> {
    try {
      const records = this.reportRepository.getFoodSummaryRecords(request);

      // Aggregate by food
      const foodMap = new Map<string, FoodSummaryRow>();

      for (const record of records) {
        const foodId = record.foodId || "(Không có mã)";
        const foodName = record.foodName || "-";
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        const existing = foodMap.get(foodId) || {
          foodId,
          foodName,
          totalQuantity: 0,
          totalCalories: 0,
          hhGroup: "",
        };

        existing.totalQuantity += quantity;
        existing.totalCalories += totalCalories;

        // Calculate hhGroup based on HH ratios > 0
        const hhGroups: string[] = [];
        if (record.hh11Ratio && parseFloat(record.hh11Ratio) > 0) {
          hhGroups.push("HH 1.1");
        }
        if (record.hh21Ratio && parseFloat(record.hh21Ratio) > 0) {
          hhGroups.push("HH 2.1");
        }
        if (record.hh22Ratio && parseFloat(record.hh22Ratio) > 0) {
          hhGroups.push("HH 2.2");
        }
        if (record.hh23Ratio && parseFloat(record.hh23Ratio) > 0) {
          hhGroups.push("HH 2.3");
        }
        if (record.hh31Ratio && parseFloat(record.hh31Ratio) > 0) {
          hhGroups.push("HH 3.1");
        }

        existing.hhGroup =
          hhGroups.length > 0 ? hhGroups.join(", ") : "Không có HH";

        foodMap.set(foodId, existing);
      }

      const data = Array.from(foodMap.values());

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting food summary:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getFoodDetail(request: {
    fromMonthYear: string;
    toMonthYear: string;
    foodId: string;
  }): Promise<GetFoodDetailResponse> {
    try {
      const records = this.reportRepository.getFoodDetailRecords(request);

      // Transform to similar format as usage calculation result
      const detailData = records.map((record: PatientDetailRow) => {
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        // Calculate used calories
        let usedCalories = 0;
        if (record.calorieUsage) {
          const usageValue = parseFloat(String(record.calorieUsage));
          if (!isNaN(usageValue)) {
            usedCalories =
              usageValue < 1
                ? Math.round(usageValue * totalCalories)
                : Math.round(usageValue * quantity);
          }
        }

        // Calculate remaining calories
        let remainingCalories = totalCalories;
        if (record.lossRatio) {
          const lossRatioValue = parseFloat(record.lossRatio);
          if (lossRatioValue < 1) {
            remainingCalories = Math.round(
              lossRatioValue * record.value * quantity
            );
          } else {
            remainingCalories = Math.round(lossRatioValue * quantity);
          }
        }

        // HH calculations
        const hh11Calories = record.hh11Ratio
          ? Math.round(parseFloat(record.hh11Ratio) * record.value * quantity)
          : undefined;
        const hh21Calories = record.hh21Ratio
          ? Math.round(parseFloat(record.hh21Ratio) * record.value * quantity)
          : undefined;
        const hh22Calories = record.hh22Ratio
          ? Math.round(parseFloat(record.hh22Ratio) * record.value * quantity)
          : undefined;
        const hh23Calories = record.hh23Ratio
          ? Math.round(parseFloat(record.hh23Ratio) * record.value * quantity)
          : undefined;
        const hh31Calories = record.hh31Ratio
          ? Math.round(parseFloat(record.hh31Ratio) * record.value * quantity)
          : undefined;

        return {
          quantity,
          value: record.value,
          calorieUsage: record.calorieUsage || "",
          foodId: record.foodId,
          originName: record.originName,
          destinationName: record.destinationName,
          insuranceTypeName: record.insuranceTypeName,
          foodName: record.foodName,
          unit: record.unit,
          monthYear: record.monthYear,
          totalCalories,
          usedCalories,
          remainingCalories,
          hh11Ratio: record.hh11Ratio || undefined,
          hh11Calories,
          hh11Patient: record.hh11Patient,
          hh21Ratio: record.hh21Ratio || undefined,
          hh21Calories,
          hh21Patient: record.hh21Patient,
          hh22Ratio: record.hh22Ratio || undefined,
          hh22Calories,
          hh22Patient: record.hh22Patient,
          hh23Ratio: record.hh23Ratio || undefined,
          hh23Calories,
          hh23Patient: record.hh23Patient,
          hh31Ratio: record.hh31Ratio || undefined,
          hh31Calories,
          hh31Patient: record.hh31Patient,
          lossRatio: record.lossRatio || undefined,
        };
      });

      return {
        success: true,
        data: detailData,
      };
    } catch (error) {
      console.error("Error getting food detail:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportFoodSummaryToExcel(
    data: FoodSummaryRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert data to worksheet format
      const worksheetData = data.map((row, index) => ({
        STT: index + 1,
        "Mã thực phẩm": row.foodId,
        "Tên thực phẩm": row.foodName,
        "Tổng số lượng": row.totalQuantity,
        "Tổng calo": row.totalCalories,
        "Nhóm hao hụt": row.hhGroup,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Báo cáo thực phẩm tổng quan"
      );

      // Write file
      XLSX.writeFile(workbook, filePath);

      return { success: true };
    } catch (error) {
      console.error("Error exporting food summary to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportFoodDetailToExcel(
    data: PatientDetailRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert data to worksheet format
      const worksheetData = data.map((row, index) => {
        const baseData: any = {
          STT: index + 1,
          "Mã số": row.foodId,
          "Nơi lấy mẫu": row.originName,
          "Nơi xuất": row.destinationName || "",
          "Loại hình": row.insuranceTypeName || "",
          "Thực phẩm": row.foodName,
          "Đơn vị tính": row.unit,
          "Giá trị": row.value,
          "Số lượng": row.quantity,
          "Ngày tháng": row.monthYear,
          "Tổng Calo": row.totalCalories,
        };

        // Add HH data if available
        if (row.hh11Ratio !== undefined) {
          baseData["HH 1.1 - Tỉ lệ"] = row.hh11Ratio;
          baseData["HH 1.1 - Calo"] = row.hh11Calories;
          baseData["HH 1.1 - Người lấy mẫu"] = row.hh11Patient;
        }
        if (row.hh21Ratio !== undefined) {
          baseData["HH 2.1 - Tỉ lệ"] = row.hh21Ratio;
          baseData["HH 2.1 - Calo"] = row.hh21Calories;
          baseData["HH 2.1 - Người lấy mẫu"] = row.hh21Patient;
        }
        if (row.hh22Ratio !== undefined) {
          baseData["HH 2.2 - Tỉ lệ"] = row.hh22Ratio;
          baseData["HH 2.2 - Calo"] = row.hh22Calories;
          baseData["HH 2.2 - Người lấy mẫu"] = row.hh22Patient;
        }
        if (row.hh23Ratio !== undefined) {
          baseData["HH 2.3 - Tỉ lệ"] = row.hh23Ratio;
          baseData["HH 2.3 - Calo"] = row.hh23Calories;
          baseData["HH 2.3 - Người lấy mẫu"] = row.hh23Patient;
        }
        if (row.hh31Ratio !== undefined) {
          baseData["HH 3.1 - Tỉ lệ"] = row.hh31Ratio;
          baseData["HH 3.1 - Calo"] = row.hh31Calories;
          baseData["HH 3.1 - Người lấy mẫu"] = row.hh31Patient;
        }

        return baseData;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Báo cáo thực phẩm chi tiết"
      );

      // Write file
      XLSX.writeFile(workbook, filePath);

      return { success: true };
    } catch (error) {
      console.error("Error exporting food detail to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export { ReportService };
