import { FoodService } from "../services/food.service.js";
import { ipcHandle } from "../utils.js";
import type { FoodWithCategories } from "../../../types/food.js";

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
  }
}
