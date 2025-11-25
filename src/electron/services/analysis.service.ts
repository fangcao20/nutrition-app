import { ReportRepository } from "../repositories/report.repository.js";
import * as path from "path";
import XLSX from "xlsx";
import { app } from "electron";

interface AnalysisPatientRow {
  patient: string;
  totalCalories: number;
  totalLoss: number;
  remainingCalories: number;
}

interface AnalysisFoodRow {
  foodName: string;
  quantity: number;
  totalLoss: number;
  hh31Loss: number;
  remainingCalories: number;
}

class AnalysisService {
  private reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  async getPatientAnalysis(request: {
    fromMonthYear: string;
    toMonthYear: string;
  }): Promise<{
    success: boolean;
    data: AnalysisPatientRow[];
    error?: string;
  }> {
    try {
      // Get patient summary data filtered by HH 3.1
      const records = this.reportRepository.getUsageRecordsForSummary(request);

      // Aggregate by patient for HH 3.1 only
      const patientMap = new Map<string, AnalysisPatientRow>();

      for (const record of records) {
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        // Calculate HH 3.1 calories
        const hh31Calories = record.hh31Ratio
          ? Math.round(parseFloat(record.hh31Ratio) * record.value * quantity)
          : 0;

        // Calculate remaining calories based on loss ratio (same as usage.service.ts)
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

        // Only include patients with HH 3.1 data
        if (record.hh31Patient && hh31Calories > 0) {
          const patient = record.hh31Patient;

          const existing = patientMap.get(patient) || {
            patient,
            totalCalories: 0,
            totalLoss: 0,
            remainingCalories: 0,
          };

          existing.totalCalories += totalCalories;
          existing.totalLoss += hh31Calories;
          existing.remainingCalories += remainingCalories;

          patientMap.set(patient, existing);
        }
      }

      const data = Array.from(patientMap.values());

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting patient analysis:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getFoodAnalysis(request: {
    fromMonthYear: string;
    toMonthYear: string;
  }): Promise<{ success: boolean; data: AnalysisFoodRow[]; error?: string }> {
    try {
      // Get food summary records with HH data
      const records = this.reportRepository.getFoodSummaryRecords(request);

      // Aggregate by food
      const foodMap = new Map<string, AnalysisFoodRow>();

      for (const record of records) {
        const foodId = record.foodId;
        const foodName = record.foodName || "(Không có tên)";
        const quantity = record.quantity;
        const totalCalories = record.value * quantity;

        // Calculate HH losses
        const hh11Loss = record.hh11Ratio
          ? Math.round(parseFloat(record.hh11Ratio) * record.value * quantity)
          : 0;
        const hh21Loss = record.hh21Ratio
          ? Math.round(parseFloat(record.hh21Ratio) * record.value * quantity)
          : 0;
        const hh22Loss = record.hh22Ratio
          ? Math.round(parseFloat(record.hh22Ratio) * record.value * quantity)
          : 0;
        const hh23Loss = record.hh23Ratio
          ? Math.round(parseFloat(record.hh23Ratio) * record.value * quantity)
          : 0;
        const hh31Loss = record.hh31Ratio
          ? Math.round(parseFloat(record.hh31Ratio) * record.value * quantity)
          : 0;

        const totalLoss = hh11Loss + hh21Loss + hh22Loss + hh23Loss + hh31Loss;

        // Calculate remaining calories based on loss ratio (same as usage.service.ts)
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

        const existing = foodMap.get(foodId) || {
          foodId,
          foodName,
          quantity: 0,
          totalLoss: 0,
          hh31Loss: 0,
          remainingCalories: 0,
        };

        existing.quantity += quantity;
        existing.totalLoss += totalLoss;
        existing.hh31Loss += hh31Loss;
        existing.remainingCalories += remainingCalories;

        foodMap.set(foodId, existing);
      }

      const data = Array.from(foodMap.values());

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error getting food analysis:", error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportPatientAnalysisToExcel(
    data: AnalysisPatientRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Prepare data for export with Vietnamese headers
      const exportData = data.map((item, index) => ({
        STT: index + 1,
        "Người lấy mẫu": item.patient,
        "Tổng calo": item.totalCalories,
        "Calo hao hụt": item.totalLoss,
        "Calo còn lại": item.remainingCalories,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const cols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
      ws["!cols"] = cols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Phân tích người lấy mẫu");

      // Write file
      XLSX.writeFile(wb, filePath);

      console.log(
        `📄 Exported ${data.length} patient analysis rows to: ${filePath}`
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Error exporting patient analysis to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async exportFoodAnalysisToExcel(
    data: AnalysisFoodRow[],
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Prepare data for export with Vietnamese headers
      const exportData = data.map((item, index) => ({
        STT: index + 1,
        "Thực phẩm": item.foodName,
        "Số lượng": item.quantity,
        "Tổng hao hụt": item.totalLoss,
        "Hao hụt HH 3.1": item.hh31Loss,
        "Calo còn lại": item.remainingCalories,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const cols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
      ws["!cols"] = cols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Phân tích thực phẩm");

      // Write file
      XLSX.writeFile(wb, filePath);

      console.log(
        `📄 Exported ${data.length} food analysis rows to: ${filePath}`
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Error exporting food analysis to Excel:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export { AnalysisService };
