import { ElectronAPI } from "../types/common";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
