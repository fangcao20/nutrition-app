export interface Food {
  id: number;
  foodId: string;
  originId: number;
  foodNameId: number;
  unitId: number;
  caloriePerUnit: number;
  calorieUsage: number;
  hh11Ratio?: string;
  hh11Patient?: string;
  hh21Ratio?: string;
  hh21Patient?: string;
  hh22Ratio?: string;
  hh22Patient?: string;
  hh23Ratio?: string;
  hh23Patient?: string;
  hh31Ratio?: string;
  hh31Patient?: string;
  lossRatio?: string;
  destinationId?: number;
  insuranceTypeId?: number;
  applyDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodWithCategories extends Food {
  originName: string;
  foodName: string;
  unit: string;
  destinationName: string;
  insuranceTypeName: string;
}

export interface CreateFoodData {
  foodId: string;
  originId: number;
  foodNameId: number;
  unitId: number;
  caloriePerUnit: number | null;
  calorieUsage: string | null;
  hh11Ratio?: string | null;
  hh11Patient?: string | null;
  hh21Ratio?: string | null;
  hh21Patient?: string | null;
  hh22Ratio?: string | null;
  hh22Patient?: string | null;
  hh23Ratio?: string | null;
  hh23Patient?: string | null;
  hh31Ratio?: string | null;
  hh31Patient?: string | null;
  lossRatio: string | null;
  destinationId: number;
  insuranceTypeId: number;
  applyDate?: string | null;
  active?: boolean | null;
}

// Service layer request interfaces
export interface CreateFoodRequest {
  foodId: string;
  originName: string;
  foodName: string;
  unit: string;
  destinationName: string;
  insuranceTypeName: string;
  caloriePerUnit: number | null;
  calorieUsage: string | null;
  hh11Ratio?: string | null;
  hh11Patient?: string | null;
  hh21Ratio?: string | null;
  hh21Patient?: string | null;
  hh22Ratio?: string | null;
  hh22Patient?: string | null;
  hh23Ratio?: string | null;
  hh23Patient?: string | null;
  hh31Ratio?: string | null;
  hh31Patient?: string | null;
  lossRatio: string | null;
  applyDate?: string | null;
  active?: boolean | null;
}

export interface UpdateFoodData extends Partial<CreateFoodData> {
  id?: never;
  foodId?: never; // Prevent updating food_id
}

export type UpdateFoodRequest = UpdateFoodData;

export interface FoodFilters {
  originId?: number;
  foodNameId?: number;
  unitId?: number;
  destinationId?: number;
  insuranceTypeId?: number;
  active?: boolean;
  search?: string;
}

export interface FoodSearchOptions {
  query: string;
  limit?: number;
  offset?: number;
}

export interface ImportError {
  row: number;
  error: string;
  foodId?: string;
  originName?: string;
  foodName?: string;
  unit?: string;
  caloriePerUnit?: string;
}

type FoodEventPayloadMapping = {
  "food:getAll": FoodWithCategories[];
  "food:getById": FoodWithCategories;
  "food:importFromExcel": {
    success: boolean;
    imported: number;
    errors: ImportError[];
  };
  "food:updateStatus": boolean;
  "food:update": boolean;
  "food:exportImportErrors": boolean;
};

interface FoodAPI {
  getAll: () => Promise<FoodWithCategories[]>;
  importFromExcel: (filePath: string) => Promise<{
    success: boolean;
    imported: number;
    errors: ImportError[];
  }>;
  updateStatus: (id: number, active: boolean) => Promise<boolean>;
  update: (id: number, data: Partial<FoodWithCategories>) => Promise<boolean>;
  exportImportErrors: (filePath: string, data: any[]) => Promise<boolean>;
}
