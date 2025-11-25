import { ipcMain, IpcMainInvokeEvent } from "electron";
import { ReportService } from "../services/report.service.js";
import { GetPatientSummaryRequest } from "../../../types/report.js";

export class ReportHandler {
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
    this.setupHandlers();
  }

  private setupHandlers() {
    ipcMain.handle(
      "report:getPatientSummary",
      this.handleGetPatientSummary.bind(this)
    );
    ipcMain.handle(
      "report:getPatientDetail",
      this.handleGetPatientDetail.bind(this)
    );
    ipcMain.handle(
      "report:exportSummaryToExcel",
      this.handleExportSummaryToExcel.bind(this)
    );
    ipcMain.handle(
      "report:exportDetailToExcel",
      this.handleExportDetailToExcel.bind(this)
    );
    ipcMain.handle(
      "report:getFoodSummary",
      this.handleGetFoodSummary.bind(this)
    );
    ipcMain.handle("report:getFoodDetail", this.handleGetFoodDetail.bind(this));
    ipcMain.handle(
      "report:exportFoodSummaryToExcel",
      this.handleExportFoodSummaryToExcel.bind(this)
    );
    ipcMain.handle(
      "report:exportFoodDetailToExcel",
      this.handleExportFoodDetailToExcel.bind(this)
    );

    console.log("✅ Report handlers registered");
  }

  private async handleGetPatientSummary(
    event: IpcMainInvokeEvent,
    request: GetPatientSummaryRequest
  ) {
    try {
      return await this.reportService.getPatientSummary(request);
    } catch (error) {
      console.error("Error getting patient summary:", error);
      throw error;
    }
  }

  private async handleGetPatientDetail(
    event: IpcMainInvokeEvent,
    request: {
      fromMonthYear: string;
      toMonthYear: string;
      patient: string;
      hhGroup: string;
    }
  ) {
    try {
      return await this.reportService.getPatientDetail(request);
    } catch (error) {
      console.error("Error getting patient detail:", error);
      throw error;
    }
  }

  private async handleExportSummaryToExcel(
    event: IpcMainInvokeEvent,
    data: any[],
    filePath: string
  ) {
    try {
      return await this.reportService.exportSummaryToExcel(data, filePath);
    } catch (error) {
      console.error("Error exporting summary to Excel:", error);
      throw error;
    }
  }

  private async handleExportDetailToExcel(
    event: IpcMainInvokeEvent,
    data: any[],
    filePath: string
  ) {
    try {
      return await this.reportService.exportDetailToExcel(data, filePath);
    } catch (error) {
      console.error("Error exporting detail to Excel:", error);
      throw error;
    }
  }

  private async handleGetFoodSummary(event: IpcMainInvokeEvent, request: any) {
    try {
      return await this.reportService.getFoodSummary(request);
    } catch (error) {
      console.error("Error getting food summary:", error);
      throw error;
    }
  }

  private async handleGetFoodDetail(event: IpcMainInvokeEvent, request: any) {
    try {
      return await this.reportService.getFoodDetail(request);
    } catch (error) {
      console.error("Error getting food detail:", error);
      throw error;
    }
  }

  private async handleExportFoodSummaryToExcel(
    event: IpcMainInvokeEvent,
    data: any[],
    filePath: string
  ) {
    try {
      return await this.reportService.exportFoodSummaryToExcel(data, filePath);
    } catch (error) {
      console.error("Error exporting food summary to Excel:", error);
      throw error;
    }
  }

  private async handleExportFoodDetailToExcel(
    event: IpcMainInvokeEvent,
    data: any[],
    filePath: string
  ) {
    try {
      return await this.reportService.exportFoodDetailToExcel(data, filePath);
    } catch (error) {
      console.error("Error exporting food detail to Excel:", error);
      throw error;
    }
  }
}
