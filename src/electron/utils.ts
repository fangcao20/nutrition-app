import { app, ipcMain } from "electron";
import { EventPayloadMapping } from "../../types/common.js";

export function isDev(): boolean {
  // Check if app is packaged (most reliable for production detection)
  if (app.isPackaged) {
    return false;
  }
  // Fallback to NODE_ENV check
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production"
  );
}

// For handlers with parameters
export function ipcHandle<
  Key extends keyof EventPayloadMapping,
  Args extends unknown[]
>(
  key: Key,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Args
  ) => Promise<EventPayloadMapping[Key]>
) {
  ipcMain.handle(key as string, handler);
}
