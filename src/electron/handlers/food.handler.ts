import { FoodService } from "../services/food.service.js";
import { ipcHandle } from "../utils.js";
import type { FoodWithCategories } from "../../../types/food.js";
import * as XLSX from "xlsx";

export class FoodHandler {
  constructor(private foodService: FoodService) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcHandle("food:getAll", async () => {
      return await this.foodService.getAllFoods();
    });

    ipcHandle("food:importFromExcel", async (event, filePath: string) => {
      return await this.foodService.importFromExcel(filePath);
    });

    ipcHandle("food:parseExcelForPreview", async (event, filePath: string) => {
      return await this.foodService.parseExcelForPreview(filePath);
    });

    ipcHandle("food:importFromData", async (event, data: any[]) => {
      return await this.foodService.importFromData(data);
    });

    ipcHandle(
      "food:updateStatus",
      async (event, id: number, active: boolean) => {
        return await this.foodService.updateStatus(id, active);
      }
    );

    ipcHandle(
      "food:update",
      async (event, id: number, data: Partial<FoodWithCategories>) => {
        return await this.foodService.updateFood(id, data);
      }
    );

    ipcHandle(
      "food:exportImportErrors",
      async (event, filePath: string, data: any[]) => {
        return await this.foodService.exportImportErrors(filePath, data);
      }
    );

    ipcHandle(
      "food:exportTableDataToExcel",
      async (event, data: any[], filePath: string) => {
        try {
          // Create worksheet from data
          const worksheet = XLSX.utils.json_to_sheet(data);

          // Create workbook
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Danh sách thực phẩm"
          );

          // Write file
          XLSX.writeFile(workbook, filePath);

          return true;
        } catch (error) {
          console.error("Error exporting table data to Excel:", error);
          return false;
        }
      }
    );

    ipcHandle("food:deleteAll", async () => {
      return await this.foodService.deleteAllFoods();
    });
  }
}
