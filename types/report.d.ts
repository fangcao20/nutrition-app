// types/report.d.ts
export interface PatientSummaryRow {
  patient: string;
  totalCalories: number;
  totalUsedCalories: number;
  totalLoss: number;
  hhGroup: string;
}

export interface PatientDetailRow {
  quantity: number;
  value: number;
  calorieUsage: string;
  foodId: string;
  originName: string;
  destinationName?: string;
  insuranceTypeName?: string;
  foodName: string;
  unit: string;
  monthYear: string;
  totalCalories: number;
  hh11Ratio?: string;
  hh11Patient?: string;
  hh11Calories?: number;
  hh21Ratio?: string;
  hh21Patient?: string;
  hh21Calories?: number;
  hh22Ratio?: string;
  hh22Patient?: string;
  hh22Calories?: number;
  hh23Ratio?: string;
  hh23Patient?: string;
  hh23Calories?: number;
  hh31Ratio?: string;
  hh31Patient?: string;
  hh31Calories?: number;
  lossRatio?: string;
}

export interface GetPatientSummaryRequest {
  fromMonthYear: string; // e.g., "2025-01"
  toMonthYear: string; // e.g., "2025-12"
}

export interface GetPatientDetailResponse {
  success: boolean;
  data: PatientDetailRow[];
  error?: string;
}

export interface FoodSummaryRow {
  foodId: string;
  foodName: string;
  totalQuantity: number;
  totalCalories: number;
  hhGroup: string;
}

export interface GetFoodSummaryRequest {
  fromMonthYear: string;
  toMonthYear: string;
}

export interface GetFoodSummaryResponse {
  success: boolean;
  data: FoodSummaryRow[];
  error?: string;
}

export interface GetFoodDetailResponse {
  success: boolean;
  data: PatientDetailRow[];
  error?: string;
}

export interface ReportAPI {
  getPatientSummary: (
    request: GetPatientSummaryRequest
  ) => Promise<GetPatientSummaryResponse>;
  getPatientDetail: (request: {
    fromMonthYear: string;
    toMonthYear: string;
    patient: string;
    hhGroup: string;
  }) => Promise<GetPatientDetailResponse>;
  exportSummaryToExcel: (
    data: PatientSummaryRow[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  exportDetailToExcel: (
    data: any[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  getFoodSummary: (
    request: GetFoodSummaryRequest
  ) => Promise<GetFoodSummaryResponse>;
  getFoodDetail: (request: {
    fromMonthYear: string;
    toMonthYear: string;
    foodId: string;
  }) => Promise<GetFoodDetailResponse>;
  exportFoodSummaryToExcel: (
    data: FoodSummaryRow[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  exportFoodDetailToExcel: (
    data: any[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface ReportEventPayloadMapping {
  "report:getPatientSummary": GetPatientSummaryResponse;
  "report:getPatientDetail": GetPatientDetailResponse;
  "report:exportSummaryToExcel": { success: boolean; error?: string };
  "report:exportDetailToExcel": { success: boolean; error?: string };
  "report:getFoodSummary": GetFoodSummaryResponse;
  "report:getFoodDetail": GetFoodDetailResponse;
  "report:exportFoodSummaryToExcel": { success: boolean; error?: string };
  "report:exportFoodDetailToExcel": { success: boolean; error?: string };
}
