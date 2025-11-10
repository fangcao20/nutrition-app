import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import { databaseManager } from "./database/database-manager.js";
import { serviceLocator } from "./services/service-locator.js";
import { FoodHandler } from "./handlers/food.handler.js";
import { DialogHandler } from "./handlers/dialog.handler.js";
import { CategoryHandler } from "./handlers/category.handler.js";
import { UsageHandler } from "./handlers/usage.handler.js";
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
});
