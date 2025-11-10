import CategoryRepository from "../repositories/category.repository.js";

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getAllCategories(search?: string) {
    const filters = search ? { search } : undefined;
    return this.categoryRepository.getAllCategories(filters);
  }

  async createCategory(type: string, name: string) {
    // Type validation
    const validTypes = [
      "origins",
      "foodNames",
      "units",
      "destinations",
      "insuranceTypes",
    ];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid category type: ${type}`);
    }

    return this.categoryRepository.createCategory(type as any, name);
  }

  async updateCategory(type: string, id: number, name: string) {
    // Type validation
    const validTypes = [
      "origins",
      "foodNames",
      "units",
      "destinations",
      "insuranceTypes",
    ];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid category type: ${type}`);
    }

    this.categoryRepository.updateCategory(type as any, id, name);
    return { success: true };
  }

  async deleteCategory(type: string, id: number) {
    // Type validation
    const validTypes = [
      "origins",
      "foodNames",
      "units",
      "destinations",
      "insuranceTypes",
    ];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid category type: ${type}`);
    }

    this.categoryRepository.deleteCategory(type as any, id);
    return { success: true };
  }
}
