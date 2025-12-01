import Database from "better-sqlite3";
import { FoodWithCategories, CreateFoodData } from "../../../types/food.js";

export class FoodRepository {
  constructor(private db: Database.Database) {}

  // Common SQL fragments
  private static readonly FOOD_SELECT_FIELDS = `
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
    f.updated_at as updatedAt
  `;

  private static readonly FOOD_WITH_CATEGORIES_SELECT = `
    ${FoodRepository.FOOD_SELECT_FIELDS},
    o.name as originName,
    fn.name as foodName,
    u.name as unit,
    d.name as destinationName,
    it.name as insuranceTypeName
  `;

  private static readonly FOOD_JOINS = `
    LEFT JOIN origins o ON f.origin_id = o.id
    LEFT JOIN food_names fn ON f.food_name_id = fn.id
    LEFT JOIN units u ON f.unit_id = u.id
    LEFT JOIN destinations d ON f.destination_id = d.id
    LEFT JOIN insurance_types it ON f.insurance_type_id = it.id
  `;

  findAll(): FoodWithCategories[] {
    const stmt = this.db.prepare(`
      SELECT ${FoodRepository.FOOD_WITH_CATEGORIES_SELECT}
      FROM foods f
      ${FoodRepository.FOOD_JOINS}
      ORDER BY f.id ASC
    `);

    return stmt.all() as FoodWithCategories[];
  }

  create(data: CreateFoodData): number {
    const stmt = this.db.prepare(`
      INSERT INTO foods (
        food_id, origin_id, food_name_id, unit_id, calorie_per_unit, calorie_usage,
        hh_1_1_ratio, hh_1_1_patient, hh_2_1_ratio, hh_2_1_patient,
        hh_2_2_ratio, hh_2_2_patient, hh_2_3_ratio, hh_2_3_patient,
        hh_3_1_ratio, hh_3_1_patient, loss_ratio, destination_id,
        insurance_type_id, apply_date, active, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, datetime('now'), datetime('now')
      )
    `);

    const result = stmt.run(
      data.foodId,
      data.originId || null,
      data.foodNameId || null,
      data.unitId || null,
      data.caloriePerUnit,
      data.calorieUsage || null,
      data.hh11Ratio || null,
      data.hh11Patient || null,
      data.hh21Ratio || null,
      data.hh21Patient || null,
      data.hh22Ratio || null,
      data.hh22Patient || null,
      data.hh23Ratio || null,
      data.hh23Patient || null,
      data.hh31Ratio || null,
      data.hh31Patient || null,
      data.lossRatio || null,
      data.destinationId || null,
      data.insuranceTypeId || null,
      data.applyDate || null,
      data.active !== undefined ? (data.active ? 1 : 0) : 1
    );

    return Number(result.lastInsertRowid);
  }

  updateStatus(id: number, active: boolean): boolean {
    const stmt = this.db.prepare(`
      UPDATE foods 
      SET active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(active ? 1 : 0, id);
    return result.changes > 0;
  }

  update(id: number, data: Partial<FoodWithCategories>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    // Map camelCase to snake_case and build update query
    if (data.calorieUsage !== undefined) {
      fields.push("calorie_usage = ?");
      values.push(data.calorieUsage);
    }
    if (data.hh11Ratio !== undefined) {
      fields.push("hh_1_1_ratio = ?");
      values.push(data.hh11Ratio);
    }
    if (data.hh11Patient !== undefined) {
      fields.push("hh_1_1_patient = ?");
      values.push(data.hh11Patient);
    }
    if (data.hh21Ratio !== undefined) {
      fields.push("hh_2_1_ratio = ?");
      values.push(data.hh21Ratio);
    }
    if (data.hh21Patient !== undefined) {
      fields.push("hh_2_1_patient = ?");
      values.push(data.hh21Patient);
    }
    if (data.hh22Ratio !== undefined) {
      fields.push("hh_2_2_ratio = ?");
      values.push(data.hh22Ratio);
    }
    if (data.hh22Patient !== undefined) {
      fields.push("hh_2_2_patient = ?");
      values.push(data.hh22Patient);
    }
    if (data.hh23Ratio !== undefined) {
      fields.push("hh_2_3_ratio = ?");
      values.push(data.hh23Ratio);
    }
    if (data.hh23Patient !== undefined) {
      fields.push("hh_2_3_patient = ?");
      values.push(data.hh23Patient);
    }
    if (data.hh31Ratio !== undefined) {
      fields.push("hh_3_1_ratio = ?");
      values.push(data.hh31Ratio);
    }
    if (data.hh31Patient !== undefined) {
      fields.push("hh_3_1_patient = ?");
      values.push(data.hh31Patient);
    }
    if (data.lossRatio !== undefined) {
      fields.push("loss_ratio = ?");
      values.push(data.lossRatio);
    }
    if (data.applyDate !== undefined) {
      fields.push("apply_date = ?");
      values.push(data.applyDate);
    }
    if (data.active !== undefined) {
      fields.push("active = ?");
      values.push(data.active ? 1 : 0);
    }

    if (fields.length === 0) {
      return true; // Nothing to update
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE foods 
      SET ${fields.join(", ")}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  // Delete all food records (use with caution)
  deleteAll(): boolean {
    const stmt = this.db.prepare(`DELETE FROM foods`);
    const result = stmt.run();
    return result.changes >= 0;
  }
}

export default FoodRepository;
