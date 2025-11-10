// Usage-related interfaces and types
// For monthly usage calculation and Excel import/export

export interface UsageInputData {
  foodId: string; // Mã số (A)
  originName: string; // Nơi lấy mẫu (B)
  foodName: string; // Thực phẩm (C)
  unit: string; // Đơn vị tính (D)
  value: number; // Giá trị (E)
  monthYear?: string; // Ngày tháng (F) - optional vì có thể không có
  quantity: number; // Số lượng (G)
}

export interface UsageCalculationRequest {
  selectedMonthYear: string; // User chọn tháng/năm khi import
  inputData: UsageInputData[];
}

export interface UsageCalculationRow {
  // Input data từ Excel
  id: number; // ID của food record trong database
  foodId: string;
  originName: string;
  foodName: string;
  unit: string;
  value: number;
  monthYear?: string;
  quantity: number;
  selectedMonthYear: string;

  // Calculated data
  totalCalories: number; // Tổng calo = giá trị x số lượng
  usedCalories: number;
  // HH ratios and patient data
  hh11Ratio?: number | null;
  hh11Calories?: number | null;
  hh11Patient?: string;
  hh21Ratio?: number | null;
  hh21Calories?: number | null;
  hh21Patient?: string;
  hh22Ratio?: number | null;
  hh22Calories?: number | null;
  hh22Patient?: string;
  hh23Ratio?: number | null;
  hh23Calories?: number | null;
  hh23Patient?: string;
  hh31Ratio?: number | null;
  hh31Calories?: number | null;
  hh31Patient?: string;
  lossRatio?: number | null;
  remainingCalories: number;
  destinationName?: string;
  insuranceTypeName?: string;
}

export interface UsageNotFoundItem {
  foodId: string;
  originName: string;
  foodName: string;
  unit: string;
  value: number;
  reason: string;
}

export interface UsageCalculationResult {
  success: boolean;
  calculatedData: UsageCalculationRow[];
  notFoundItems: UsageNotFoundItem[];
  notFoundFilePath?: string;
}

export interface UsageRecord {
  id?: number;
  food_record_id: string;
  sample_date: string;
  quantity: number;
  import_month_year: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaveUsageRequest {
  records: UsageCalculationRow[];
  import_month_year: string;
}

export interface SaveUsageResponse {
  success: boolean;
  saved_count: number;
  error?: string;
}

export interface UsageAPI {
  calculateUsage: (
    request: UsageCalculationRequest
  ) => Promise<UsageCalculationResult>;
  parseExcel: (filePath: string) => Promise<UsageInputData[]>;
  exportNotFoundItems: (
    items: UsageNotFoundItem[],
    selectedMonthYear: string
  ) => Promise<string>;
  exportToExcel: (
    data: UsageCalculationRow[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  saveUsageRecords: (request: SaveUsageRequest) => Promise<SaveUsageResponse>;
  getUsageHistory: (
    importMonthYear: string
  ) => Promise<{
    success: boolean;
    data: UsageCalculationRow[];
    error?: string;
  }>;
}

export interface UsageEventPayloadMapping {
  "usage:calculate": UsageCalculationResult;
  "usage:exportNotFound": string;
  "usage:parseExcel": UsageInputData[];
  "usage:exportToExcel": { success: boolean; error?: string };
  "usage:saveUsageRecords": SaveUsageResponse;
  "usage:getUsageHistory": {
    success: boolean;
    data: UsageCalculationRow[];
    error?: string;
  };
}
