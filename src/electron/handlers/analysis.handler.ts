import { ipcMain } from "electron";
import { AnalysisService } from "../services/analysis.service.js";

export class AnalysisHandler {
  constructor(private analysisService: AnalysisService) {
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle("analysis:getPatientAnalysis", async (event, request) => {
      return await this.analysisService.getPatientAnalysis(request);
    });

    ipcMain.handle("analysis:getFoodAnalysis", async (event, request) => {
      return await this.analysisService.getFoodAnalysis(request);
    });

    ipcMain.handle(
      "analysis:exportPatientAnalysisToExcel",
      async (event, data, filePath) => {
        return await this.analysisService.exportPatientAnalysisToExcel(
          data,
          filePath
        );
      }
    );

    ipcMain.handle(
      "analysis:exportFoodAnalysisToExcel",
      async (event, data, filePath) => {
        return await this.analysisService.exportFoodAnalysisToExcel(
          data,
          filePath
        );
      }
    );
  }
}
