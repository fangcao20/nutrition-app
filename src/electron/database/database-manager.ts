import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";
import MigrationRunner from "./migration-runner.js";
import { isDev } from "../utils.js";

/**
 * Database manager for the nutrition tracking app
 * Handles SQLite connection, configuration, and migrations
 */
export class DatabaseManager {
  private db: Database.Database | null = null;
  private migrationRunner: MigrationRunner | null = null;

  /**
   * Get the database file path in user data directory
   */
  private getDatabasePath(): string {
    const userDataPath = app.getPath("userData");

    // Use different database files for different environments
    let dbFileName: string;

    if (isDev()) {
      dbFileName = "nutrition-dev.db";
    } else {
      dbFileName = "nutrition.db";
    }

    const dbPath = path.join(userDataPath, dbFileName);

    return dbPath;
  }

  /**
   * Configure SQLite database for optimal performance
   */
  private configureDatabase(): void {
    if (!this.db) return;

    console.log("⚙️  Configuring database...");

    // Enable foreign key constraints
    this.db.pragma("foreign_keys = ON");

    // Use WAL mode for better concurrency (multiple readers, one writer)
    this.db.pragma("journal_mode = WAL");

    // Optimize for performance
    this.db.pragma("synchronous = NORMAL"); // Good balance of safety and performance
    this.db.pragma("cache_size = 10000"); // 10MB cache
    this.db.pragma("temp_store = MEMORY"); // Store temp tables in memory
    this.db.pragma("mmap_size = 268435456"); // 256MB memory-mapped I/O

    console.log("✅ Database configured successfully");
  }

  /**
   * Initialize database connection and run migrations
   */
  public async initialize(): Promise<void> {
    try {
      const dbPath = this.getDatabasePath();
      console.log(`📁 Database path: ${dbPath}`);

      // Create database connection
      this.db = new Database(dbPath);
      console.log("🔗 Database connection established");

      // Configure database
      this.configureDatabase();

      // Initialize migration runner
      const migrationsPath = path.join(app.getAppPath(), "src/electron/database/migrations");
      this.migrationRunner = new MigrationRunner(this.db, migrationsPath);

      // Run migrations
      console.log("🚀 Running database migrations...");
      this.migrationRunner.runMigrations();

      // Validate migrations
      if (!this.migrationRunner.validateMigrations()) {
        throw new Error("Migration validation failed");
      }

      console.log("✅ Database initialized successfully");
      console.log(
        `📊 Current database version: ${this.migrationRunner.getCurrentVersion()}`
      );
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get database connection (must call initialize() first)
   */
  public getConnection(): Database.Database {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Get migration runner instance
   */
  public getMigrationRunner(): MigrationRunner {
    if (!this.migrationRunner) {
      throw new Error(
        "Migration runner not initialized. Call initialize() first."
      );
    }
    return this.migrationRunner;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      console.log("🔒 Closing database connection...");
      this.db.close();
      this.db = null;
      this.migrationRunner = null;
      console.log("✅ Database connection closed");
    }
  }

  /**
   * Create a database backup
   */
  public async createBackup(backupPath?: string): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultBackupPath =
      backupPath ||
      path.join(
        app.getPath("userData"),
        "backups",
        `nutrition-backup-${timestamp}.db`
      );

    try {
      // Ensure backup directory exists
      const backupDir = path.dirname(defaultBackupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup using SQLite backup API
      await this.db.backup(defaultBackupPath);

      console.log(`✅ Database backup created: ${defaultBackupPath}`);
      return defaultBackupPath;
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  public getStats(): {
    version: number;
    path: string;
    size: number;
    tables: Array<{ name: string; count: number }>;
  } {
    if (!this.db || !this.migrationRunner) {
      throw new Error("Database not initialized");
    }

    // Get file size
    const dbPath = this.getDatabasePath();
    const size = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

    // Get table counts
    const tables = [
      "origins",
      "food_names",
      "units",
      "destinations",
      "insurance_types",
      "foods",
    ];

    const tableCounts = tables.map((tableName) => {
      try {
        const result = this.db!.prepare(
          `SELECT COUNT(*) as count FROM ${tableName}`
        ).get() as { count: number };
        return { name: tableName, count: result.count };
      } catch {
        return { name: tableName, count: 0 };
      }
    });

    return {
      version: this.migrationRunner.getCurrentVersion(),
      path: dbPath,
      size,
      tables: tableCounts,
    };
  }

  /**
   * Execute a raw SQL query (for debugging/admin purposes)
   */
  public executeRaw(sql: string, params?: unknown[]): unknown {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        return this.db.prepare(sql).all(params);
      } else {
        return this.db.prepare(sql).run(params);
      }
    } catch (error) {
      console.error("❌ Raw SQL execution failed:", error);
      throw error;
    }
  }

  /**
   * Clear all data from database (for testing only)
   * WARNING: This will delete all data!
   */
  public async clearDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const environment = process.env.NODE_ENV || "development";
    if (environment === "production") {
      throw new Error("Cannot clear database in production environment");
    }

    try {
      console.log("🗑️  Clearing database...");

      // Disable foreign key constraints temporarily
      this.db.exec("PRAGMA foreign_keys = OFF");

      // Clear all data from tables (in reverse order to respect foreign keys)
      const clearTables = [
        "foods",
        "insurance_types",
        "destinations",
        "units",
        "food_names",
        "origins",
      ];

      for (const table of clearTables) {
        try {
          this.db.exec(`DELETE FROM ${table}`);
          console.log(`  ✅ Cleared ${table}`);
        } catch (error) {
          console.warn(`  ⚠️  Could not clear ${table}:`, error);
        }
      }

      // Re-enable foreign key constraints
      this.db.exec("PRAGMA foreign_keys = ON");

      console.log("✅ Database cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear database:", error);
      throw error;
    }
  }

  /**
   * Reset database to initial state (clear + re-seed)
   */
  public async resetDatabase(): Promise<void> {
    const environment = process.env.NODE_ENV || "development";
    if (environment === "production") {
      throw new Error("Cannot reset database in production environment");
    }

    try {
      console.log("🔄 Resetting database...");

      // Clear all data
      await this.clearDatabase();

      // Re-run seed migrations
      if (this.migrationRunner) {
        // Just re-run all migrations to ensure seed data is restored
        await this.migrationRunner.runMigrations();
        console.log("✅ Database reset and re-seeded");
      }
    } catch (error) {
      console.error("❌ Failed to reset database:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();
export default databaseManager;
