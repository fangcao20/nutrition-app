import { ipcMain, IpcMainInvokeEvent } from "electron";
import { UsageService } from "../services/usage.service.js";
import { UsageCalculationRequest } from "../../../types/usage.js";

export class UsageHandler {
  private usageService: UsageService;

  constructor(usageService: UsageService) {
    this.usageService = usageService;
    this.setupHandlers();
  }

  private setupHandlers() {
    ipcMain.handle("usage:calculate", this.handleCalculateUsage.bind(this));
    ipcMain.handle("usage:parseExcel", this.handleParseExcel.bind(this));
    ipcMain.handle(
      "usage:exportNotFound",
      this.handleExportNotFound.bind(this)
    );
    ipcMain.handle("usage:exportToExcel", this.handleExportToExcel.bind(this));
    ipcMain.handle(
      "usage:saveUsageRecords",
      this.handleSaveUsageRecords.bind(this)
    );
    ipcMain.handle(
      "usage:getUsageHistory",
      this.handleGetUsageHistory.bind(this)
    );

    console.log("✅ Usage handlers registered");
  }

  private async handleCalculateUsage(
    event: IpcMainInvokeEvent,
    request: UsageCalculationRequest
  ) {
    try {
      return await this.usageService.calculateUsage(request);
    } catch (error) {
      console.error("Error calculating usage:", error);
      throw error;
    }
  }

  private async handleParseExcel(event: IpcMainInvokeEvent, filePath: string) {
    try {
      return await this.usageService.parseExcelFile(filePath);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw error;
    }
  }

  private async handleExportNotFound(
    event: IpcMainInvokeEvent,
    items: any[],
    monthYear: string
  ) {
    try {
      return await this.usageService.exportNotFoundItems(items, monthYear);
    } catch (error) {
      console.error("Error exporting not found items:", error);
      throw error;
    }
  }

  private async handleExportToExcel(
    event: IpcMainInvokeEvent,
    data: any[],
    filePath: string
  ) {
    try {
      return await this.usageService.exportToExcel(data, filePath);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw error;
    }
  }

  private async handleSaveUsageRecords(
    event: IpcMainInvokeEvent,
    request: any
  ) {
    try {
      return await this.usageService.saveUsageRecords(request);
    } catch (error) {
      console.error("Error saving usage records:", error);
      throw error;
    }
  }

  private async handleGetUsageHistory(
    event: IpcMainInvokeEvent,
    importMonthYear: string
  ) {
    try {
      return await this.usageService.getUsageHistory(importMonthYear);
    } catch (error) {
      console.error("Error getting usage history:", error);
      throw error;
    }
  }
}
