import { FoodAPI, FoodEventPayloadMapping } from "./food";
import { CategoryAPI, CategoryEventPayloadMapping } from "./category";
import { UsageAPI, UsageEventPayloadMapping } from "./usage";

export interface DatabaseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  changes?: number;
  id?: string | number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResult<T> {
  results: T[];
  query: string;
  total: number;
}

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userName: string;
  createdAt: number;
  notes: string | null;
}

export interface DatabaseStats {
  version: number;
  path: string;
  size: number;
  tables: Array<{ name: string; count: number }>;
}

export interface MigrationInfo {
  version: number;
  filename: string;
  appliedAt: number;
}

// Common filter base interface
export interface BaseFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

export interface UpdateEventPayloadMapping {
  "update-available": any;
  "update-progress": any;
  "update-downloaded": void;
  "update:download": void;
  "update:install": void;
}

export type EventPayloadMapping = FoodEventPayloadMapping &
  CategoryEventPayloadMapping &
  UsageEventPayloadMapping &
  DialogEventPayloadMapping &
  UpdateEventPayloadMapping;

export interface UpdateAPI {
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateProgress: (callback: (progress: any) => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  downloadUpdate: () => Promise<UpdateEventPayloadMapping["update:download"]>;
  installUpdate: () => Promise<UpdateEventPayloadMapping["update:install"]>;
}

export interface ElectronAPI {
  food: FoodAPI;
  category: CategoryAPI;
  usage: UsageAPI;
  dialog: DialogAPI;
  update: UpdateAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
