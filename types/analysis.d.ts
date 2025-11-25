export interface AnalysisPatientRow {
  patient: string;
  totalCalories: number;
  totalLoss: number;
  remainingCalories: number;
}

export interface AnalysisFoodRow {
  foodName: string;
  quantity: number;
  totalLoss: number;
  hh31Loss: number;
  remainingCalories: number;
}

export interface GetAnalysisRequest {
  fromMonthYear: string;
  toMonthYear: string;
}

export interface GetPatientAnalysisResponse {
  success: boolean;
  data: AnalysisPatientRow[];
  error?: string;
}

export interface GetFoodAnalysisResponse {
  success: boolean;
  data: AnalysisFoodRow[];
  error?: string;
}

export interface AnalysisAPI {
  getPatientAnalysis: (
    request: GetAnalysisRequest
  ) => Promise<GetPatientAnalysisResponse>;
  getFoodAnalysis: (
    request: GetAnalysisRequest
  ) => Promise<GetFoodAnalysisResponse>;
  exportPatientAnalysisToExcel: (
    data: AnalysisPatientRow[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
  exportFoodAnalysisToExcel: (
    data: AnalysisFoodRow[],
    filePath: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface AnalysisEventPayloadMapping {
  "analysis:getPatientAnalysis": GetPatientAnalysisResponse;
  "analysis:getFoodAnalysis": GetFoodAnalysisResponse;
  "analysis:exportPatientAnalysisToExcel": { success: boolean; error?: string };
  "analysis:exportFoodAnalysisToExcel": { success: boolean; error?: string };
}
