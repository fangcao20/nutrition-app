import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI, EventPayloadMapping } from "../../types/common";
import { FoodAPI, FoodWithCategories } from "../../types/food";

function ipcInvoke<
  Key extends keyof EventPayloadMapping,
  Args extends unknown[]
>(key: Key, ...args: Args): Promise<EventPayloadMapping[Key]> {
  return ipcRenderer.invoke(key as string, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
): void {
  ipcRenderer.on(key as string, (_, payload: EventPayloadMapping[Key]) => {
    callback(payload);
  });
}

const foodAPI: FoodAPI = {
  getAll: () => ipcInvoke("food:getAll"),
  importFromExcel: (filePath: string) =>
    ipcInvoke("food:importFromExcel", filePath),
  updateStatus: (id: number, active: boolean) =>
    ipcInvoke("food:updateStatus", id, active),
  update: (id: number, data: Partial<FoodWithCategories>) =>
    ipcInvoke("food:update", id, data),
};

const categoryAPI = {
  getAll: (search?: string) => ipcInvoke("categories:getAll", search),
  create: (type: string, name: string) =>
    ipcInvoke("categories:create", type, name),
  update: (type: string, id: number, name: string) =>
    ipcInvoke("categories:update", type, id, name),
  delete: (type: string, id: number) =>
    ipcInvoke("categories:delete", type, id),
};

const usageAPI = {
  calculateUsage: (request: any) => ipcInvoke("usage:calculate", request),
  parseExcel: (filePath: string) => ipcInvoke("usage:parseExcel", filePath),
  exportNotFoundItems: (items: any[], monthYear: string) =>
    ipcInvoke("usage:exportNotFound", items, monthYear),
  exportToExcel: (data: any[], filePath: string) =>
    ipcInvoke("usage:exportToExcel", data, filePath),
  saveUsageRecords: (request: any) =>
    ipcInvoke("usage:saveUsageRecords", request),
  getUsageHistory: (importMonthYear: string) =>
    ipcInvoke("usage:getUsageHistory", importMonthYear),
};

const dialogAPI = {
  showOpenDialog: (options: any) => ipcInvoke("dialog:showOpenDialog", options),
  showSaveDialog: (options: any) => ipcInvoke("dialog:showSaveDialog", options),
};

const electronAPI: ElectronAPI = {
  food: foodAPI,
  category: categoryAPI,
  usage: usageAPI,
  dialog: dialogAPI,
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
