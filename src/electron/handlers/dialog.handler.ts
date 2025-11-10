import { ipcMain, dialog } from "electron";

export class DialogHandler {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Show open dialog for file selection
    ipcMain.handle("dialog:showOpenDialog", async (_, options) => {
      try {
        const result = await dialog.showOpenDialog(options);
        return result;
      } catch (error) {
        console.error("Error in showOpenDialog:", error);
        throw error;
      }
    });

    // Show save dialog for file saving
    ipcMain.handle("dialog:showSaveDialog", async (_, options) => {
      try {
        const result = await dialog.showSaveDialog(options);
        return result;
      } catch (error) {
        console.error("Error in showSaveDialog:", error);
        throw error;
      }
    });

    console.log("✅ Dialog handlers registered");
  }
}

export default DialogHandler;
