import { ipcMain } from "electron";
import pkg from "electron-updater";
const { autoUpdater } = pkg;

export class UpdateHandler {
  constructor() {
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle download update request
    ipcMain.handle("update:download", async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error("Error downloading update:", error);
        return { success: false, error: String(error) };
      }
    });

    // Handle install update request
    ipcMain.handle("update:install", async () => {
      try {
        autoUpdater.quitAndInstall();
        return { success: true };
      } catch (error) {
        console.error("Error installing update:", error);
        return { success: false, error: String(error) };
      }
    });
  }
}
