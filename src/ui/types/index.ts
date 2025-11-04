// Core types for the nutrition app

export interface Category {
  id: string;
  type: "origin" | "destination" | "insurance_type";
  name: string;
  created_at: number;
}

export interface Food {
  id: string; // Mã số (K01, K02...)
  name: string; // Thực phẩm
  origin_id: string | null; // Nơi lấy mẫu
  origin_name?: string; // For display
  unit: string; // Đơn vị tính
  calorie_per_unit: number; // Giá trị calo/đơn vị
  calorie_usage: number | string | null; // Calo sử dụng (có thể là số hoặc %)
  base_quantity: number; // Số lượng cơ bản
  // HH allocations
  hh_1_1_ratio?: string | null;
  hh_1_1_patient?: string | null;
  hh_2_1_ratio?: string | null;
  hh_2_1_patient?: string | null;
  hh_2_2_ratio?: string | null;
  hh_2_2_patient?: string | null;
  hh_2_3_ratio?: string | null;
  hh_2_3_patient?: string | null;
  hh_3_1_ratio?: string | null;
  hh_3_1_patient?: string | null;
  loss_ratio?: string | null; // TL lỗ
  destination_id: string | null; // Nơi xuất
  destination_name?: string; // For display
  insurance_type_id: string | null; // Loại hình
  insurance_type_name?: string; // For display
  apply_date?: string | null; // Ngày áp dụng
  active: boolean; // Còn sử dụng
  created_at: number;
  updated_at: number;
}

export interface FoodAllocation {
  id: string;
  food_id: string;
  component_code: "HH_1_1" | "HH_2_1" | "HH_2_2" | "HH_2_3" | "HH_3_1";
  component_name: string; // HH 1.1, HH 2.1...
  ratio: number; // Tỉ lệ hao hụt (có thể là số nguyên hoặc < 1 cho %)
  ratio_type: "percentage" | "absolute";
  patient_name: string | null; // Bệnh nhân
  created_at: number;
}

export interface UsageRecord {
  id: string;
  food_id: string;
  food_name?: string; // For display
  usage_date: string; // Date string
  quantity: number; // Số lượng sử dụng
  month: number; // 1-12
  year: number;
  total_calorie: number; // Tổng calo
  calorie_usage: number | null; // Calo sử dụng (user input)
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface UsageCalculation {
  id: string;
  usage_id: string;
  component_code: string;
  patient_name: string | null;
  ratio: number;
  ratio_type: "percentage" | "absolute";
  allocated_calorie: number; // Calo được phân bổ
  created_at: number;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  user_name: string;
  created_at: number;
  notes: string | null;
}

// Calculation result types
export interface ComponentResult {
  component_code: string;
  component_name: string;
  patient_name: string | null;
  ratio: number;
  ratio_type: "percentage" | "absolute";
  allocated_calorie: number;
}

export interface CalculationDetailResult {
  usage_id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  total_calorie: number;
  calorie_usage: number;
  components: ComponentResult[];
  remaining_calorie: number;
}

export interface AggregatedComponentResult {
  calorie: number;
  patients: string[];
}

export interface CalculationSummary {
  total_calorie: number;
  total_calorie_usage: number;
  components: Record<string, AggregatedComponentResult>;
  remaining_calorie: number;
}

export interface CalculationResult {
  details: CalculationDetailResult[];
  summary: CalculationSummary;
}
