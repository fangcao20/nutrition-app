import { FoodRepository } from "../repositories/food.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  FoodWithCategories,
  CreateFoodRequest,
  CreateFoodData,
} from "../../../types/food.js";
import * as path from "path";
import XLSX from "xlsx";

export class FoodService {
  constructor(
    private foodRepository: FoodRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async getAllFoods(): Promise<FoodWithCategories[]> {
    return this.foodRepository.findAll();
  }

  async updateStatus(id: number, active: boolean): Promise<boolean> {
    return this.foodRepository.updateStatus(id, active);
  }

  async updateFood(
    id: number,
    data: Partial<FoodWithCategories>
  ): Promise<boolean> {
    return this.foodRepository.update(id, data);
  }

  async parseExcelForPreview(filePath: string): Promise<{
    success: boolean;
    data: CreateFoodRequest[];
    errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }>;
  }> {
    const errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }> = [];
    const parsedData: CreateFoodRequest[] = [];

    try {
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (![".xlsx", ".xls"].includes(ext)) {
        throw new Error("File không đúng định dạng Excel (.xlsx, .xls)");
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as unknown[][];

      if (data.length < 3) {
        throw new Error(
          "File Excel cần có ít nhất 3 dòng (2 dòng tiêu đề + 1 dòng dữ liệu). Vui lòng kiểm tra định dạng file."
        );
      }

      // Skip 2 header rows, process from row 3
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;

        try {
          // Skip empty rows
          if (!row || row.every((cell) => !cell)) continue;

          // Map Excel columns to food data
          const foodData = this.mapExcelRowToFood(row);

          if (foodData) {
            parsedData.push(foodData);
          }
        } catch (error) {
          // Try to parse some basic data for error reporting
          let foodId = "";
          let originName = "";
          let foodName = "";
          let unit = "";
          let caloriePerUnit = "";

          try {
            foodId = this.getCellValue(row[0]) || "";
            originName = this.getCellValue(row[1]) || "";
            foodName = this.getCellValue(row[2]) || "";
            unit = this.getCellValue(row[3]) || "";
            caloriePerUnit = this.getCellValue(row[4]) || "";
          } catch {
            // Ignore parse errors for error data
          }

          errors.push({
            row: rowNum,
            error:
              error instanceof Error
                ? this.getUserFriendlyErrorMessage(error)
                : "Lỗi không xác định",
            foodId,
            originName,
            foodName,
            unit,
            caloriePerUnit,
          });
        }
      }

      return {
        success: errors.length === 0,
        data: parsedData,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [
          {
            row: 0,
            error:
              error instanceof Error
                ? this.getUserFriendlyErrorMessage(error)
                : "Lỗi đọc file Excel",
            foodId: "",
            originName: "",
            foodName: "",
            unit: "",
            caloriePerUnit: "",
          },
        ],
      };
    }
  }

  async importFromData(data: CreateFoodRequest[]): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }>;
  }> {
    const errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }> = [];
    let imported = 0;

    for (let i = 0; i < data.length; i++) {
      const foodData = data[i];
      const rowNum = i + 1;

      try {
        await this.createFoodFromImport(foodData);
        imported++;
      } catch (error) {
        errors.push({
          row: rowNum,
          error:
            error instanceof Error
              ? this.getUserFriendlyErrorMessage(error)
              : "Lỗi không xác định",
          foodId: foodData.foodId,
          originName: foodData.originName,
          foodName: foodData.foodName,
          unit: foodData.unit,
          caloriePerUnit: foodData.caloriePerUnit?.toString(),
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  }

  async importFromExcel(filePath: string): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }>;
  }> {
    const errors: Array<{
      row: number;
      error: string;
      foodId?: string;
      originName?: string;
      foodName?: string;
      unit?: string;
      caloriePerUnit?: string;
    }> = [];
    let imported = 0;

    try {
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (![".xlsx", ".xls"].includes(ext)) {
        throw new Error("File không đúng định dạng Excel (.xlsx, .xls)");
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as unknown[][];

      if (data.length < 3) {
        throw new Error(
          "File Excel cần có ít nhất 3 dòng (2 dòng tiêu đề + 1 dòng dữ liệu). Vui lòng kiểm tra định dạng file."
        );
      }

      // Skip 2 header rows, process from row 3
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 1;

        try {
          // Skip empty rows
          if (!row || row.every((cell) => !cell)) continue;

          // Map Excel columns to food data
          const foodData = this.mapExcelRowToFood(row);

          if (foodData) {
            // Create food record
            await this.createFoodFromImport(foodData);
            imported++;
          }
        } catch (error) {
          // Try to parse some basic data for error reporting
          let foodId = "";
          let originName = "";
          let foodName = "";
          let unit = "";
          let caloriePerUnit = "";

          try {
            foodId = this.getCellValue(row[0]) || "";
            originName = this.getCellValue(row[1]) || "";
            foodName = this.getCellValue(row[2]) || "";
            unit = this.getCellValue(row[3]) || "";
            caloriePerUnit = this.getCellValue(row[4]) || "";
          } catch {
            // Ignore parse errors for error data
          }

          errors.push({
            row: rowNum,
            error:
              error instanceof Error
                ? this.getUserFriendlyErrorMessage(error)
                : "Lỗi không xác định",
            foodId,
            originName,
            foodName,
            unit,
            caloriePerUnit,
          });
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [
          {
            row: 0,
            error:
              error instanceof Error
                ? this.getUserFriendlyErrorMessage(error)
                : "Lỗi đọc file Excel",
            foodId: "",
            originName: "",
            foodName: "",
            unit: "",
            caloriePerUnit: "",
          },
        ],
      };
    }
  }

  private mapExcelRowToFood(row: unknown[]): CreateFoodRequest | null {
    // Excel columns mapping based on the image:
    // A(0): Mã số, B(1): Nơi lấy mẫu, C(2): Thực phẩm, D(3): Đơn vị tính, E(4): Giá trị
    // F(5): Ngày tháng, G(6): Số lượng, H(7): Tổng Calo, I(8): HH1.1 Tỉ lệ, J(9): HH1.1 Tổng Calo sử dụng
    // K(10): HH1.1 Tỉ lệ, L(11): HH1.1 Calo, M(12): HH1.1 Người lấy mẫu, N(13): HH2.1 Tỉ lệ, O(14): HH2.1 Calo
    // P(15): HH2.1 Người lấy mẫu, Q(16): HH2.2 Tỉ lệ, R(17): HH2.2 Calo, S(18): HH2.2 Người lấy mẫu, T(19): HH2.3 Tỉ lệ
    // U(20): HH2.3 Calo, V(21): HH2.3 Người lấy mẫu, W(22): HH3.1 Tỉ lệ, X(23): HH3.1 Calo, Y(24): HH3.1 Người lấy mẫu
    // Z(25): TL%, AA(26): Calo còn lại, AB(27): Nơi xuất, AC(28): Loại hình, AD(29): Ngày áp dụng, AE(30): Con số dương

    const id = this.getCellValue(row[0]);
    const originName = this.getCellValue(row[1]);
    const foodName = this.getCellValue(row[2]);
    const unit = this.getCellValue(row[3]);
    const caloriePerUnit = this.parseNumber(row[4]);

    // Validate required fields
    if (!id) {
      throw new Error("Thiếu mã số thực phẩm");
    }
    if (!foodName) {
      throw new Error("Thiếu tên thực phẩm");
    }
    if (!unit) {
      throw new Error("Thiếu đơn vị tính");
    }
    if (caloriePerUnit === null) {
      throw new Error("Giá trị calorie không hợp lệ");
    }

    return {
      foodId: String(id),
      originName: originName || "",
      foodName: foodName,
      unit: unit,
      caloriePerUnit: caloriePerUnit,
      calorieUsage: this.parseCalorieUsage(row[8]), // H - Tổng Calo
      hh11Ratio: this.parseCalorieUsage(row[10]), // K - HH1.1 Tỉ lệ
      hh11Patient: this.getCellValue(row[12]), // M - HH1.1 Người lấy mẫu
      hh21Ratio: this.parseCalorieUsage(row[13]), // N - HH2.1 Tỉ lệ
      hh21Patient: this.getCellValue(row[15]), // P - HH2.1 Người lấy mẫu
      hh22Ratio: this.parseCalorieUsage(row[16]), // Q - HH2.2 Tỉ lệ
      hh22Patient: this.getCellValue(row[18]), // S - HH2.2 Người lấy mẫu
      hh23Ratio: this.parseCalorieUsage(row[19]), // T - HH2.3 Tỉ lệ
      hh23Patient: this.getCellValue(row[21]), // V - HH2.3 Người lấy mẫu
      hh31Ratio: this.parseCalorieUsage(row[22]), // W - HH3.1 Tỉ lệ
      hh31Patient: this.getCellValue(row[24]), // Y - HH3.1 Người lấy mẫu
      lossRatio: this.parseCalorieUsage(row[25]), // Z - TL%
      destinationName: this.getCellValue(row[27]) || "", // AB - Nơi xuất
      insuranceTypeName: this.getCellValue(row[28]) || "", // AC - Loại hình
      applyDate: this.getCellValue(row[29]), // AD - Ngày áp dụng
      active: this.parseBoolean(row[30]), // AE - Con số dương
    };
  }

  private getCellValue(cell: unknown): string | null {
    if (cell === undefined || cell === null || cell === "") {
      return null;
    }
    const trimmed = String(cell).trim();
    return trimmed === "" ? null : trimmed;
  }

  private parseNumber(cell: unknown): number | null {
    if (cell === undefined || cell === null || cell === "") {
      return null;
    }

    const num = Number(cell);
    return isNaN(num) ? null : num;
  }

  private parseCalorieUsage(cell: unknown): string | null {
    if (cell === undefined || cell === null || cell === "") {
      return null;
    }

    const value = String(cell).trim();
    if (value === "") return null;

    // Case 3: If it's a percentage string (contains %), convert to decimal
    if (value.includes("%")) {
      const percentValue = value.replace("%", "").trim();
      const num = Number(percentValue);
      if (!isNaN(num)) {
        return (num / 100).toString(); // e.g., "23.5%" -> "0.235"
      }
      return value; // fallback to original if can't parse
    }

    // For numeric values, check if it's already a number type
    if (typeof cell === "number") {
      return cell.toString(); // e.g., 720000 -> "720000", 0.235 -> "0.235"
    }

    // Case 1 & 2: Parse string numbers (with or without commas)
    const numericValue = value.replace(/,/g, ""); // Remove commas: "720,000" -> "720000"
    const num = Number(numericValue);

    if (!isNaN(num)) {
      // Return as string to maintain consistency
      // e.g., "720000" -> "720000", "0.235" -> "0.235"
      return num.toString();
    }

    // If it's neither percentage nor valid number, return as string
    return value;
  }

  private parseBoolean(cell: unknown): boolean {
    if (cell === undefined || cell === null || cell === "") {
      return true; // Default active
    }

    const value = String(cell).toLowerCase().trim();
    return !["false", "0", "no", "inactive", "ngưng"].includes(value);
  }

  // Convert technical error messages to user-friendly messages
  private getUserFriendlyErrorMessage(error: Error): string {
    const errorMessage = error.message;

    // UNIQUE constraint errors
    if (errorMessage.includes("UNIQUE constraint failed")) {
      return `Thông tin thực phẩm này đã tồn tại trong hệ thống.`;
    }

    // Validation errors (provide column hints)
    if (errorMessage.includes("Thiếu mã số thực phẩm")) {
      return 'Cột "Mã số" (cột A) không được để trống. Vui lòng nhập mã thực phẩm.';
    }
    if (errorMessage.includes("Thiếu tên thực phẩm")) {
      return 'Cột "Thực phẩm" (cột C) không được để trống. Vui lòng nhập tên thực phẩm.';
    }
    if (errorMessage.includes("Thiếu đơn vị tính")) {
      return 'Cột "Đơn vị tính" (cột D) không được để trống. Vui lòng nhập đơn vị (kg, g, ml, ...)';
    }
    if (errorMessage.includes("Giá trị calorie không hợp lệ")) {
      return 'Cột "Giá trị" (cột E) phải là số hợp lệ. Vui lòng nhập số calorie/đơn vị.';
    }

    // Database constraint errors
    if (errorMessage.includes("FOREIGN KEY constraint")) {
      return "Dữ liệu tham chiếu không hợp lệ. Kiểm tra lại danh mục liên quan.";
    }
    if (errorMessage.includes("CHECK constraint")) {
      return "Dữ liệu không đáp ứng điều kiện. Kiểm tra lại giá trị nhập vào.";
    }
    if (errorMessage.includes("NOT NULL constraint")) {
      return "Thiếu dữ liệu bắt buộc. Vui lòng điền đầy đủ thông tin.";
    }

    // File format errors
    if (errorMessage.includes("File không đúng định dạng Excel")) {
      return "File phải có định dạng Excel (.xlsx hoặc .xls). Vui lòng chọn file Excel hợp lệ.";
    }
    if (errorMessage.includes("File Excel cần có ít nhất 3 dòng")) {
      return "File Excel phải có ít nhất 3 dòng (2 dòng tiêu đề + dữ liệu). Kiểm tra lại định dạng file.";
    }

    // File access errors
    if (
      errorMessage.includes("ENOENT") ||
      errorMessage.includes("no such file")
    ) {
      return "Không tìm thấy file. File có thể đã bị di chuyển hoặc xóa.";
    }
    if (
      errorMessage.includes("EACCES") ||
      errorMessage.includes("permission denied")
    ) {
      return "Không có quyền truy cập file. Vui lòng kiểm tra quyền đọc file.";
    }
    if (
      errorMessage.includes("file is locked") ||
      errorMessage.includes("in use")
    ) {
      return "File đang được sử dụng bởi ứng dụng khác. Vui lòng đóng file Excel trước khi import.";
    }

    // Number parsing errors
    if (
      errorMessage.includes("Invalid number") ||
      errorMessage.includes("NaN")
    ) {
      return "Giá trị số không hợp lệ. Vui lòng kiểm tra các ô chứa số (calorie, tỉ lệ hao hụt).";
    }

    // Date parsing errors
    if (errorMessage.includes("Invalid date")) {
      return "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng dd/mm/yyyy.";
    }

    // Memory/size errors
    if (
      errorMessage.includes("out of memory") ||
      errorMessage.includes("too large")
    ) {
      return "File quá lớn hoặc hết bộ nhớ. Vui lòng thử với file nhỏ hơn.";
    }

    // Default case - return original message with helpful context
    if (errorMessage.length > 100) {
      return `Lỗi xử lý dữ liệu: ${errorMessage.substring(0, 100)}...`;
    }
    return `Lỗi: ${errorMessage}`;
  }

  // Export import errors to Excel
  async exportImportErrors(filePath: string, data: any[]): Promise<boolean> {
    try {
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");

      // Write file
      XLSX.writeFile(workbook, filePath);

      return true;
    } catch (error) {
      console.error("Error exporting import errors:", error);
      return false;
    }
  }

  async deleteAllFoods(): Promise<boolean> {
    try {
      return this.foodRepository.deleteAll();
    } catch (error) {
      console.error("Error deleting all foods:", error);
      return false;
    }
  }
  private async createFoodFromImport(data: CreateFoodRequest): Promise<void> {
    try {
      // Find or create category IDs - chỉ khi có dữ liệu
      const originId =
        data.originName && data.originName.trim()
          ? this.categoryRepository.findOrCreateOrigin(data.originName)
          : 0;
      const foodNameId = this.categoryRepository.findOrCreateFoodName(
        data.foodName
      );
      const unitId = this.categoryRepository.findOrCreateUnit(data.unit);
      const destinationId =
        data.destinationName && data.destinationName.trim()
          ? this.categoryRepository.findOrCreateDestination(
              data.destinationName
            )
          : 0;
      const insuranceTypeId =
        data.insuranceTypeName && data.insuranceTypeName.trim()
          ? this.categoryRepository.findOrCreateInsuranceType(
              data.insuranceTypeName
            )
          : 0;

      // Create the food record - sử dụng CreateFoodData interface
      const createData: CreateFoodData = {
        foodId: data.foodId,
        originId: originId,
        foodNameId: foodNameId,
        unitId: unitId,
        caloriePerUnit: data.caloriePerUnit,
        calorieUsage: data.calorieUsage,
        hh11Ratio: data.hh11Ratio,
        hh11Patient: data.hh11Patient,
        hh21Ratio: data.hh21Ratio,
        hh21Patient: data.hh21Patient,
        hh22Ratio: data.hh22Ratio,
        hh22Patient: data.hh22Patient,
        hh23Ratio: data.hh23Ratio,
        hh23Patient: data.hh23Patient,
        hh31Ratio: data.hh31Ratio,
        hh31Patient: data.hh31Patient,
        lossRatio: data.lossRatio || "",
        destinationId: destinationId,
        insuranceTypeId: insuranceTypeId,
        applyDate: data.applyDate,
        active:
          data.active !== undefined && data.active !== null
            ? data.active
            : null,
      };

      const foodId = this.foodRepository.create(createData);

      console.log(`✅ Created food record with ID: ${foodId}`);
    } catch (error) {
      console.error("Error creating food from import:", error);
      throw error;
    }
  }
}
