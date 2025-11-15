import Database from "better-sqlite3";
import {
  UsageCalculationRequest,
  UsageCalculationResult,
  UsageCalculationRow,
  UsageNotFoundItem,
} from "../../../types/usage.js";
import { FoodWithCategories } from "../../../types/food.js";

class UsageRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Find food data for calculation based on unique index
  findFoodForUsage(
    foodId: string,
    originName: string,
    foodName: string,
    unit: string,
    caloriePerUnit: number
  ): FoodWithCategories | null {
    const query = `
      SELECT 
        f.id,
        f.food_id as foodId,
        f.origin_id as originId,
        f.food_name_id as foodNameId,
        f.unit_id as unitId,
        f.calorie_per_unit as caloriePerUnit,
        f.calorie_usage as calorieUsage,
        f.hh_1_1_ratio as hh11Ratio,
        f.hh_1_1_patient as hh11Patient,
        f.hh_2_1_ratio as hh21Ratio,
        f.hh_2_1_patient as hh21Patient,
        f.hh_2_2_ratio as hh22Ratio,
        f.hh_2_2_patient as hh22Patient,
        f.hh_2_3_ratio as hh23Ratio,
        f.hh_2_3_patient as hh23Patient,
        f.hh_3_1_ratio as hh31Ratio,
        f.hh_3_1_patient as hh31Patient,
        f.loss_ratio as lossRatio,
        f.destination_id as destinationId,
        f.insurance_type_id as insuranceTypeId,
        f.apply_date as applyDate,
        f.active,
        f.created_at as createdAt,
        f.updated_at as updatedAt,
        o.name as originName,
        fn.name as foodName,
        u.name as unit,
        d.name as destinationName,
        it.name as insuranceTypeName
      FROM foods f
      LEFT JOIN origins o ON f.origin_id = o.id
      LEFT JOIN food_names fn ON f.food_name_id = fn.id  
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN destinations d ON f.destination_id = d.id
      LEFT JOIN insurance_types it ON f.insurance_type_id = it.id
      WHERE f.food_id = ? 
        AND o.name = ?
        AND fn.name = ?
        AND u.name = ?
        AND ABS(f.calorie_per_unit - ?) < 0.01
        AND f.active = 1
      LIMIT 1
    `;

    const stmt = this.db.prepare(query);
    return stmt.get(
      foodId,
      originName,
      foodName,
      unit,
      caloriePerUnit
    ) as FoodWithCategories | null;
  }

  // Calculate usage data
  calculateUsageData(request: UsageCalculationRequest): UsageCalculationResult {
    const calculatedData: UsageCalculationRow[] = [];
    const notFoundItems: UsageNotFoundItem[] = [];

    for (const inputItem of request.inputData) {
      // Find matching food in database
      const foodData = this.findFoodForUsage(
        inputItem.foodId,
        inputItem.originName,
        inputItem.foodName,
        inputItem.unit,
        inputItem.value
      );

      if (!foodData) {
        // Add to not found list
        notFoundItems.push({
          foodId: inputItem.foodId,
          originName: inputItem.originName,
          foodName: inputItem.foodName,
          unit: inputItem.unit,
          value: inputItem.value,
          reason: "Không tìm thấy trong cơ sở dữ liệu hoặc đã ngừng hoạt động",
        });
        continue;
      }

      // Calculate calories based on formulas
      const totalCalories = inputItem.value * inputItem.quantity; // Tổng calo = giá trị x số lượng

      // Calculate HH calories using same logic as remaining calories
      const calculateHHCalories = (
        ratioStr: string | null | undefined
      ): number | null => {
        if (!ratioStr || !ratioStr.trim()) return null;
        const ratioValue = parseFloat(ratioStr);
        if (ratioValue < 1) {
          // If < 1, it's a percentage ratio, multiply by caloriePerUnit and quantity
          return Math.round(
            ratioValue * foodData.caloriePerUnit * inputItem.quantity
          );
        } else {
          // If >= 1, it's an absolute value, multiply by quantity only
          return Math.round(ratioValue * inputItem.quantity);
        }
      };

      const hh11Calories = calculateHHCalories(foodData.hh11Ratio);
      const hh21Calories = calculateHHCalories(foodData.hh21Ratio);
      const hh22Calories = calculateHHCalories(foodData.hh22Ratio);
      const hh23Calories = calculateHHCalories(foodData.hh23Ratio);
      const hh31Calories = calculateHHCalories(foodData.hh31Ratio);

      // Calculate remaining calories (loss ratio x số lượng) - convert string to number
      let remainingCalories = 0;
      if (foodData.lossRatio && foodData.lossRatio.trim()) {
        const lossRatioValue = parseFloat(foodData.lossRatio);
        if (lossRatioValue < 1) {
          // If < 1, it's a percentage ratio, multiply by caloriePerUnit and quantity
          remainingCalories = Math.round(
            lossRatioValue * foodData.caloriePerUnit * inputItem.quantity
          );
        } else {
          // If >= 1, it's an absolute value, multiply by quantity only
          remainingCalories = Math.round(lossRatioValue * inputItem.quantity);
        }
      }

      const calculatedRow: UsageCalculationRow = {
        ...inputItem,
        id: foodData.id, // Add the database ID from food record
        selectedMonthYear: request.selectedMonthYear,
        totalCalories,
        usedCalories: foodData.calorieUsage,
        hh11Ratio:
          foodData.hh11Ratio && foodData.hh11Ratio.trim()
            ? parseFloat(foodData.hh11Ratio)
            : null,
        hh11Calories,
        hh11Patient: foodData.hh11Patient,
        hh21Ratio:
          foodData.hh21Ratio && foodData.hh21Ratio.trim()
            ? parseFloat(foodData.hh21Ratio)
            : null,
        hh21Calories,
        hh21Patient: foodData.hh21Patient,
        hh22Ratio:
          foodData.hh22Ratio && foodData.hh22Ratio.trim()
            ? parseFloat(foodData.hh22Ratio)
            : null,
        hh22Calories,
        hh22Patient: foodData.hh22Patient,
        hh23Ratio:
          foodData.hh23Ratio && foodData.hh23Ratio.trim()
            ? parseFloat(foodData.hh23Ratio)
            : null,
        hh23Calories,
        hh23Patient: foodData.hh23Patient,
        hh31Ratio:
          foodData.hh31Ratio && foodData.hh31Ratio.trim()
            ? parseFloat(foodData.hh31Ratio)
            : null,
        hh31Calories,
        hh31Patient: foodData.hh31Patient,
        remainingCalories,
        destinationName: foodData.destinationName,
        insuranceTypeName: foodData.insuranceTypeName,
        applyDate: foodData.applyDate,
        active: !!foodData.active,
        lossRatio:
          foodData.lossRatio && foodData.lossRatio.trim()
            ? parseFloat(foodData.lossRatio)
            : null,
      };

      calculatedData.push(calculatedRow);
    }

    return {
      success: true,
      calculatedData,
      notFoundItems,
    };
  }

  // Save usage calculation results (optional - for historical tracking)
  saveUsageCalculation(data: UsageCalculationRow[]): number {
    // This could create a usage_calculations table to store results
    // For now, just return success
    return data.length;
  }
}

export default UsageRepository;
