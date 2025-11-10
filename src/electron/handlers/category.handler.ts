import { CategoryService } from "../services/category.service.js";
import { ipcHandle } from "../utils.js";

export class CategoryHandler {
  constructor(private categoryService: CategoryService) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcHandle("categories:getAll", async (event, search?: string) => {
      return await this.categoryService.getAllCategories(search);
    });

    ipcHandle(
      "categories:create",
      async (event, type: string, name: string) => {
        return await this.categoryService.createCategory(type, name);
      }
    );

    ipcHandle(
      "categories:update",
      async (event, type: string, id: number, name: string) => {
        return await this.categoryService.updateCategory(type, id, name);
      }
    );

    ipcHandle("categories:delete", async (event, type: string, id: number) => {
      return await this.categoryService.deleteCategory(type, id);
    });

    console.log("✅ Category handlers registered");
  }
}
