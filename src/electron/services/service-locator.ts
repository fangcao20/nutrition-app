import { databaseManager } from "../database/database-manager.js";
import { FoodRepository } from "../repositories/food.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import UsageRepository from "../repositories/usage.repository.js";
import { FoodService } from "./food.service.js";
import { CategoryService } from "./category.service.js";
import { UsageService } from "./usage.service.js";

export class ServiceLocator {
  private static instance: ServiceLocator;
  private services: Map<string, unknown> = new Map();
  private isInitialized = false;

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize database first
    const db = databaseManager.getConnection();

    // Create repositories
    const foodRepository = new FoodRepository(db);
    const categoryRepository = new CategoryRepository(db);
    const usageRepository = new UsageRepository(db);

    // Create services
    const foodService = new FoodService(foodRepository, categoryRepository);
    const categoryService = new CategoryService(categoryRepository);
    const usageService = new UsageService(usageRepository);

    // Register services
    this.services.set("food", foodService);
    this.services.set("category", categoryService);
    this.services.set("usage", usageService);

    this.isInitialized = true;
    console.log("✅ Service locator initialized");
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service as T;
  }

  // Optional: Get all available service names for debugging
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  // Static convenience methods
  static getFoodService(): FoodService {
    return ServiceLocator.getInstance().get<FoodService>("food");
  }

  static getCategoryService(): CategoryService {
    return ServiceLocator.getInstance().get<CategoryService>("category");
  }

  static getUsageService(): UsageService {
    return ServiceLocator.getInstance().get<UsageService>("usage");
  }
}

export const serviceLocator = ServiceLocator.getInstance();
