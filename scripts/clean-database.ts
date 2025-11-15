#!/usr/bin/env node

import fs from "fs";
import path from "path";

/**
 * Script to clean/remove SQLite database files
 * Supports both development and production environments
 */

interface CleanOptions {
  environment: "dev" | "prod";
  verbose?: boolean;
}

/**
 * Get the database file path based on environment
 */
function getDatabasePath(environment: "dev" | "prod"): string {
  // This mimics the logic from DatabaseManager.getDatabasePath()
  let userDataPath: string;

  // In a standalone script, we need to determine the user data path manually
  if (process.platform === "darwin") {
    userDataPath = path.join(
      process.env.HOME || "",
      "Library/Application Support/nutrition-app"
    );
  } else if (process.platform === "win32") {
    userDataPath = path.join(process.env.APPDATA || "", "nutrition-app");
  } else {
    // Linux and other Unix-like systems
    userDataPath = path.join(process.env.HOME || "", ".config/nutrition-app");
  }

  const dbFileName =
    environment === "dev" ? "nutrition-dev.db" : "nutrition.db";
  return path.join(userDataPath, dbFileName);
}

/**
 * Remove database file if it exists
 */
function cleanDatabase(options: CleanOptions): void {
  const { environment, verbose = true } = options;
  const dbPath = getDatabasePath(environment);

  if (verbose) {
    console.log(`🔍 Checking ${environment} database at: ${dbPath}`);
  }

  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log(`✅ Removed ${environment} database: ${dbPath}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${environment} database:`, error);
      process.exit(1);
    }
  } else {
    if (verbose) {
      console.log(`ℹ️  ${environment} database not found, skipping cleanup`);
    }
  }
}

/**
 * Clean WAL and SHM files (SQLite auxiliary files)
 */
function cleanAuxiliaryFiles(options: CleanOptions): void {
  const { environment, verbose = true } = options;
  const dbPath = getDatabasePath(environment);

  // Clean WAL file (Write-Ahead Log)
  const walPath = `${dbPath}-wal`;
  if (fs.existsSync(walPath)) {
    try {
      fs.unlinkSync(walPath);
      if (verbose) {
        console.log(`✅ Removed WAL file: ${walPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not remove WAL file:`, error);
    }
  }

  // Clean SHM file (Shared Memory)
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(shmPath)) {
    try {
      fs.unlinkSync(shmPath);
      if (verbose) {
        console.log(`✅ Removed SHM file: ${shmPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not remove SHM file:`, error);
    }
  }
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const environment = args[0] as "dev" | "prod";
  const verbose = !args.includes("--quiet");

  if (!environment || !["dev", "prod"].includes(environment)) {
    console.error("Usage: npm run clean:db <dev|prod> [--quiet]");
    console.error("Examples:");
    console.error("  npm run clean:db dev");
    console.error("  npm run clean:db prod");
    console.error("  npm run clean:db dev --quiet");
    process.exit(1);
  }

  if (verbose) {
    console.log(`🗑️  Cleaning ${environment} database...`);
  }

  try {
    cleanDatabase({ environment, verbose });
    cleanAuxiliaryFiles({ environment, verbose });

    if (verbose) {
      console.log(`🎉 ${environment} database cleanup completed`);
    }
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanDatabase, getDatabasePath };
