import { app } from "electron";
import path from "path";
import { isDev } from "./utils.js";

export function getPreloadPath(): string {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.cjs"
  );
}

export function getMigrationsPath(): string {
  if (isDev()) {
    // Development: use source path
    return path.join(app.getAppPath(), "src/electron/database/migrations");
  } else {
    // Production: migrations are copied to app bundle
    return path.join(app.getAppPath(), "src/electron/database/migrations");
  }
}
