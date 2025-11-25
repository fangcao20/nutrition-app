import { app, BrowserWindow, screen } from "electron";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import path from "path";
import { isDev } from "./utils.js";
import { databaseManager } from "./database/database-manager.js";
import { serviceLocator } from "./services/service-locator.js";
import { FoodHandler } from "./handlers/food.handler.js";
import { DialogHandler } from "./handlers/dialog.handler.js";
import { CategoryHandler } from "./handlers/category.handler.js";
import { UsageHandler } from "./handlers/usage.handler.js";
import { UpdateHandler } from "./handlers/update.handler.js";
import { ReportHandler } from "./handlers/report.handler.js";
import { AnalysisHandler } from "./handlers/analysis.handler.js";
import { getPreloadPath } from "./pathResolver.js";

// Initialize database and handlers
async function initializeApp() {
  try {
    console.log("🚀 Initializing nutrition app...");

    // Initialize database
    await databaseManager.initialize();

    // Initialize all services (handles all dependencies internally)
    await serviceLocator.initialize();

    // Initialize handlers
    new FoodHandler(serviceLocator.get("food"));
    new DialogHandler();
    new CategoryHandler(serviceLocator.get("category"));
    new UsageHandler(serviceLocator.get("usage"));
    new UpdateHandler();
    new ReportHandler(serviceLocator.get("report"));
    new AnalysisHandler(serviceLocator.get("analysis"));

    console.log("✅ App initialization complete");
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    app.quit();
  }
}

app.on("ready", async () => {
  // Initialize app components first
  await initializeApp();

  // Get screen size
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  // Setup auto-updater for production builds
  if (!isDev()) {
    setupAutoUpdater(mainWindow);
  }
});

// Auto-updater configuration
function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Configure auto-updater
  autoUpdater.autoDownload = false; // Ask user before downloading
  autoUpdater.autoInstallOnAppQuit = true;

  // Check for updates when app is ready
  autoUpdater.checkForUpdatesAndNotify();

  // Set up periodic update checks (every 30 minutes)
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 30 * 60 * 1000);

  // Event listeners
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    // You can show a notification to user here
    mainWindow.webContents.send("update-available", info);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("Update not available.");
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-updater error:", err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log("Download progress:", Math.round(progressObj.percent) + "%");
    mainWindow.webContents.send("update-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    mainWindow.webContents.send("update-downloaded");
    // Auto-restart to apply update
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000); // Give user 5 seconds to save work
  });
}
