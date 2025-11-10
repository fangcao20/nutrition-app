import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { getMigrationsPath } from "../pathResolver.js";

/**
 * Simple migration runner for SQLite database
 * Works like Flyway - reads numbered SQL files and applies them in order
 */
export class MigrationRunner {
  private db: Database.Database;
  private migrationsPath: string;

  constructor(db: Database.Database, migrationsPath?: string) {
    this.db = db;
    this.migrationsPath = migrationsPath || getMigrationsPath();
    this.ensureMigrationTable();
  }

  /**
   * Create migration tracking table if it doesn't exist
   */
  private ensureMigrationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  /**
   * Extract version number from migration filename
   * V001__initial_schema.sql -> 1
   * V002__seed_data.sql -> 2
   */
  private extractVersion(filename: string): number {
    const match = filename.match(/^V(\d+)__/);
    if (!match) {
      throw new Error(
        `Invalid migration filename format: ${filename}. Expected format: V001__description.sql`
      );
    }
    return parseInt(match[1], 10);
  }

  /**
   * Check if a migration version has already been applied
   */
  private isApplied(version: number): boolean {
    const result = this.db
      .prepare("SELECT 1 FROM schema_migrations WHERE version = ?")
      .get(version);
    return !!result;
  }

  /**
   * Mark a migration as applied
   */
  private markAsApplied(version: number, filename: string): void {
    this.db
      .prepare(
        "INSERT INTO schema_migrations (version, filename) VALUES (?, ?)"
      )
      .run(version, filename);
  }

  /**
   * Get all migration files sorted by version
   */
  private getMigrationFiles(): string[] {
    if (!fs.existsSync(this.migrationsPath)) {
      throw new Error(`Migrations directory not found: ${this.migrationsPath}`);
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith(".sql") && file.match(/^V\d+__/))
      .sort((a, b) => {
        const versionA = this.extractVersion(a);
        const versionB = this.extractVersion(b);
        return versionA - versionB;
      });

    return files;
  }

  /**
   * Get current database version (highest applied migration)
   */
  public getCurrentVersion(): number {
    try {
      const result = this.db
        .prepare("SELECT MAX(version) as version FROM schema_migrations")
        .get() as { version: number | null };
      return result.version || 0;
    } catch {
      return 0; // First time setup
    }
  }

  /**
   * Get pending migrations that haven't been applied yet
   */
  public getPendingMigrations(): Array<{ version: number; filename: string }> {
    const allFiles = this.getMigrationFiles();
    return allFiles
      .map((filename) => ({
        version: this.extractVersion(filename),
        filename,
      }))
      .filter((migration) => !this.isApplied(migration.version));
  }

  /**
   * Run all pending migrations
   */
  public runMigrations(): void {
    const pendingMigrations = this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log("✅ Database is up to date");
      return;
    }

    console.log(
      `🔄 Running ${pendingMigrations.length} pending migration(s)...`
    );

    for (const migration of pendingMigrations) {
      this.runSingleMigration(migration.version, migration.filename);
    }

    console.log("🎉 All migrations completed successfully");
  }

  /**
   * Run a single migration file within a transaction
   */
  private runSingleMigration(version: number, filename: string): void {
    const filePath = path.join(this.migrationsPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    console.log(`📦 Applying migration ${version}: ${filename}`);

    try {
      // Read SQL file
      const sql = fs.readFileSync(filePath, "utf8");

      // Execute migration in transaction
      const transaction = this.db.transaction(() => {
        // Execute the migration SQL
        this.db.exec(sql);

        // Mark as applied
        this.markAsApplied(version, filename);
      });

      transaction();

      console.log(`✅ Migration ${version} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${version} failed:`, error);
      throw error; // Re-throw to stop migration process
    }
  }

  /**
   * Get migration history
   */
  public getMigrationHistory(): Array<{
    version: number;
    filename: string;
    applied_at: number;
  }> {
    return this.db
      .prepare(
        `
        SELECT version, filename, applied_at 
        FROM schema_migrations 
        ORDER BY version ASC
      `
      )
      .all() as Array<{
      version: number;
      filename: string;
      applied_at: number;
    }>;
  }

  /**
   * Validate that all migration files exist for applied versions
   */
  public validateMigrations(): boolean {
    const appliedMigrations = this.getMigrationHistory();
    const availableFiles = this.getMigrationFiles();

    for (const applied of appliedMigrations) {
      if (!availableFiles.includes(applied.filename)) {
        console.warn(
          `⚠️  Applied migration file not found: ${applied.filename}`
        );
        return false;
      }
    }

    return true;
  }
}

export default MigrationRunner;
