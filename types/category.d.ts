// Category-related interfaces and types
// Covers: origins, food_names, units, destinations, insurance_types

export interface Category {
  id: number;
  name: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCategoryData {
  name: string;
  active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  active?: boolean;
}

export interface CategoryFilters {
  active?: boolean;
  search?: string;
}

// Specific category types (using type aliases for clarity)
export type Origin = Category;
export type FoodName = Category;
export type Unit = Category;
export type Destination = Category;
export type InsuranceType = Category;

// Grouped categories response
export interface AllCategories {
  origins: Origin[];
  foodNames: FoodName[];
  units: Unit[];
  destinations: Destination[];
  insuranceTypes: InsuranceType[];
}

// Category type enum for dynamic operations
export type CategoryType =
  | "origins"
  | "foodNames"
  | "units"
  | "destinations"
  | "insuranceTypes";

// Table name mapping
export const CATEGORY_TABLE_MAP: Record<CategoryType, string> = {
  origins: "origins",
  foodNames: "food_names",
  units: "units",
  destinations: "destinations",
  insuranceTypes: "insurance_types",
} as const;

// API interfaces
export interface CategoryAPI {
  getAll: (search?: string) => Promise<AllCategories>;
  create: (type: string, name: string) => Promise<number>;
  update: (
    type: string,
    id: number,
    name: string
  ) => Promise<{ success: boolean }>;
  delete: (type: string, id: number) => Promise<{ success: boolean }>;
}

// Event payload mappings for categories
export interface CategoryEventPayloadMapping {
  "categories:getAll": AllCategories;
  "categories:create": number;
  "categories:update": { success: boolean };
  "categories:delete": { success: boolean };
}
