import Database from "better-sqlite3";
import {
  GetPatientSummaryRequest,
  PatientDetailRow,
} from "../../../types/report.js";

class ReportRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getUsageRecordsForSummary(
    request: GetPatientSummaryRequest
  ): PatientDetailRow[] {
    const query = `
      SELECT
        ur.quantity,
        f.calorie_per_unit as value,
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
        f.loss_ratio as lossRatio
      FROM usage_records ur
      JOIN foods f ON ur.food_record_id = f.id
      WHERE ur.import_month_year BETWEEN ? AND ?
      ORDER BY ur.created_at DESC
    `;

    return this.db
      .prepare(query)
      .all(request.fromMonthYear, request.toMonthYear) as PatientDetailRow[];
  }

  getPatientDetailRecords(request: {
    fromMonthYear: string;
    toMonthYear: string;
    patient: string;
    hhGroup: string;
  }): PatientDetailRow[] {
    let whereClause = "";
    if (request.hhGroup === "HH 3.1") {
      whereClause = "AND f.hh_3_1_patient = ?";
    } else if (request.hhGroup === "HH 1.1") {
      whereClause = "AND f.hh_1_1_patient = ?";
    } else if (request.hhGroup === "HH 2.1") {
      whereClause = "AND f.hh_2_1_patient = ?";
    } else if (request.hhGroup === "HH 2.2") {
      whereClause = "AND f.hh_2_2_patient = ?";
    } else if (request.hhGroup === "HH 2.3") {
      whereClause = "AND f.hh_2_3_patient = ?";
    }

    const query = `
      SELECT
        ur.quantity,
        f.calorie_per_unit as value,
        f.calorie_usage as calorieUsage,
        f.food_id as foodId,
        o.name as originName,
        d.name as destinationName,
        it.name as insuranceTypeName,
        fn.name as foodName,
        u.name as unit,
        ur.sample_date as monthYear,
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
        f.loss_ratio as lossRatio
      FROM usage_records ur
      JOIN foods f ON ur.food_record_id = f.id
      LEFT JOIN origins o ON f.origin_id = o.id
      LEFT JOIN destinations d ON f.destination_id = d.id
      LEFT JOIN insurance_types it ON f.insurance_type_id = it.id
      LEFT JOIN food_names fn ON f.food_name_id = fn.id
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE ur.import_month_year BETWEEN ? AND ?
      ${whereClause}
      ORDER BY ur.created_at DESC
    `;

    const params = whereClause
      ? [request.fromMonthYear, request.toMonthYear, request.patient]
      : [request.fromMonthYear, request.toMonthYear];

    return this.db.prepare(query).all(...params) as PatientDetailRow[];
  }

  getFoodDetailRecords(request: {
    fromMonthYear: string;
    toMonthYear: string;
    foodId: string;
  }): PatientDetailRow[] {
    const query = `
      SELECT
        ur.quantity,
        f.calorie_per_unit as value,
        f.calorie_usage as calorieUsage,
        f.food_id as foodId,
        o.name as originName,
        d.name as destinationName,
        it.name as insuranceTypeName,
        fn.name as foodName,
        u.name as unit,
        ur.sample_date as monthYear,
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
        f.loss_ratio as lossRatio
      FROM usage_records ur
      JOIN foods f ON ur.food_record_id = f.id
      LEFT JOIN origins o ON f.origin_id = o.id
      LEFT JOIN destinations d ON f.destination_id = d.id
      LEFT JOIN insurance_types it ON f.insurance_type_id = it.id
      LEFT JOIN food_names fn ON f.food_name_id = fn.id
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE ur.import_month_year BETWEEN ? AND ?
      AND f.food_id = ?
      ORDER BY ur.created_at DESC
    `;

    return this.db
      .prepare(query)
      .all(
        request.fromMonthYear,
        request.toMonthYear,
        request.foodId
      ) as PatientDetailRow[];
  }

  getFoodSummaryRecords(request: {
    fromMonthYear: string;
    toMonthYear: string;
  }): any[] {
    const query = `
      SELECT
        f.food_id as foodId,
        fn.name as foodName,
        ur.quantity,
        f.calorie_per_unit as value,
        f.hh_1_1_ratio as hh11Ratio,
        f.hh_2_1_ratio as hh21Ratio,
        f.hh_2_2_ratio as hh22Ratio,
        f.hh_2_3_ratio as hh23Ratio,
        f.hh_3_1_ratio as hh31Ratio,
        f.loss_ratio as lossRatio
      FROM usage_records ur
      JOIN foods f ON ur.food_record_id = f.id
      LEFT JOIN food_names fn ON f.food_name_id = fn.id
      WHERE ur.import_month_year BETWEEN ? AND ?
      ORDER BY f.food_id, ur.created_at DESC
    `;

    return this.db
      .prepare(query)
      .all(request.fromMonthYear, request.toMonthYear);
  }
}

export { ReportRepository };
