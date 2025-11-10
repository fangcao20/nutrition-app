import Database from "better-sqlite3";
import {
  AllCategories,
  CategoryType,
  CategoryFilters,
  Origin,
  FoodName,
  Unit,
  Destination,
  InsuranceType,
} from "../../../types/category.js";

export class CategoryRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // New comprehensive category management methods
  getAllCategories(filters?: CategoryFilters): AllCategories {
    return {
      origins: this.getOrigins(filters?.search),
      foodNames: this.getFoodNames(filters?.search),
      units: this.getUnits(filters?.search),
      destinations: this.getDestinations(filters?.search),
      insuranceTypes: this.getInsuranceTypes(filters?.search),
    };
  }

  private getOrigins(search?: string): Origin[] {
    let query =
      "SELECT id, name, 1 as active, 0 as createdAt, 0 as updatedAt FROM origins WHERE 1=1";
    const params: string[] = [];

    if (search) {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name";
    const stmt = this.db.prepare(query);
    return stmt.all(params) as Origin[];
  }

  private getFoodNames(search?: string): FoodName[] {
    let query =
      "SELECT id, name, 1 as active, 0 as createdAt, 0 as updatedAt FROM food_names WHERE 1=1";
    const params: string[] = [];

    if (search) {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name";
    const stmt = this.db.prepare(query);
    return stmt.all(params) as FoodName[];
  }

  private getUnits(search?: string): Unit[] {
    let query =
      "SELECT id, name, 1 as active, 0 as createdAt, 0 as updatedAt FROM units WHERE 1=1";
    const params: string[] = [];

    if (search) {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name";
    const stmt = this.db.prepare(query);
    return stmt.all(params) as Unit[];
  }

  private getDestinations(search?: string): Destination[] {
    let query =
      "SELECT id, name, 1 as active, 0 as createdAt, 0 as updatedAt FROM destinations WHERE 1=1";
    const params: string[] = [];

    if (search) {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name";
    const stmt = this.db.prepare(query);
    return stmt.all(params) as Destination[];
  }

  private getInsuranceTypes(search?: string): InsuranceType[] {
    let query =
      "SELECT id, name, 1 as active, 0 as createdAt, 0 as updatedAt FROM insurance_types WHERE 1=1";
    const params: string[] = [];

    if (search) {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name";
    const stmt = this.db.prepare(query);
    return stmt.all(params) as InsuranceType[];
  }

  // Generic category operations
  createCategory(type: CategoryType, name: string): number {
    const table = this.getTableForType(type);
    const stmt = this.db.prepare(`INSERT INTO ${table} (name) VALUES (?)`);
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  updateCategory(type: CategoryType, id: number, name: string): void {
    const table = this.getTableForType(type);
    const stmt = this.db.prepare(`UPDATE ${table} SET name = ? WHERE id = ?`);
    stmt.run(name, id);
  }

  deleteCategory(type: CategoryType, id: number): void {
    const table = this.getTableForType(type);
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    stmt.run(id);
  }

  private getTableForType(type: CategoryType): string {
    switch (type) {
      case "origins":
        return "origins";
      case "foodNames":
        return "food_names";
      case "units":
        return "units";
      case "destinations":
        return "destinations";
      case "insuranceTypes":
        return "insurance_types";
      default:
        throw new Error(`Unknown category type: ${type}`);
    }
  }

  // Original find/create methods for Excel import compatibility
  // Origins
  findOriginByName(name: string): { id: number; name: string } | undefined {
    const stmt = this.db.prepare("SELECT id, name FROM origins WHERE name = ?");
    return stmt.get(name) as { id: number; name: string } | undefined;
  }

  createOrigin(name: string): number {
    const stmt = this.db.prepare("INSERT INTO origins (name) VALUES (?)");
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  findOrCreateOrigin(name: string): number {
    const existing = this.findOriginByName(name);
    if (existing) {
      return existing.id;
    }
    return this.createOrigin(name);
  }

  // Food Names
  findFoodNameByName(name: string): { id: number; name: string } | undefined {
    const stmt = this.db.prepare(
      "SELECT id, name FROM food_names WHERE name = ?"
    );
    return stmt.get(name) as { id: number; name: string } | undefined;
  }

  createFoodName(name: string): number {
    const stmt = this.db.prepare("INSERT INTO food_names (name) VALUES (?)");
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  findOrCreateFoodName(name: string): number {
    const existing = this.findFoodNameByName(name);
    if (existing) {
      return existing.id;
    }
    return this.createFoodName(name);
  }

  // Units
  findUnitByName(name: string): { id: number; name: string } | undefined {
    const stmt = this.db.prepare("SELECT id, name FROM units WHERE name = ?");
    return stmt.get(name) as { id: number; name: string } | undefined;
  }

  createUnit(name: string): number {
    const stmt = this.db.prepare("INSERT INTO units (name) VALUES (?)");
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  findOrCreateUnit(name: string): number {
    const existing = this.findUnitByName(name);
    if (existing) {
      return existing.id;
    }
    return this.createUnit(name);
  }

  // Destinations
  findDestinationByName(
    name: string
  ): { id: number; name: string } | undefined {
    const stmt = this.db.prepare(
      "SELECT id, name FROM destinations WHERE name = ?"
    );
    return stmt.get(name) as { id: number; name: string } | undefined;
  }

  createDestination(name: string): number {
    const stmt = this.db.prepare("INSERT INTO destinations (name) VALUES (?)");
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  findOrCreateDestination(name: string): number {
    const existing = this.findDestinationByName(name);
    if (existing) {
      return existing.id;
    }
    return this.createDestination(name);
  }

  // Insurance Types
  findInsuranceTypeByName(
    name: string
  ): { id: number; name: string } | undefined {
    const stmt = this.db.prepare(
      "SELECT id, name FROM insurance_types WHERE name = ?"
    );
    return stmt.get(name) as { id: number; name: string } | undefined;
  }

  createInsuranceType(name: string): number {
    const stmt = this.db.prepare(
      "INSERT INTO insurance_types (name) VALUES (?)"
    );
    const result = stmt.run(name);
    return Number(result.lastInsertRowid);
  }

  findOrCreateInsuranceType(name: string): number {
    const existing = this.findInsuranceTypeByName(name);
    if (existing) {
      return existing.id;
    }
    return this.createInsuranceType(name);
  }
}

export default CategoryRepository;
