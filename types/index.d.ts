// Global type definitions for the nutrition app
// This file makes all types available globally without explicit imports

/// <reference types="./food.d.ts" />
/// <reference types="./common.d.ts" />
/// <reference types="./category.d.ts" />
/// <reference types="./dialog.d.ts" />
/// <reference types="./usage.d.ts" />

// Re-export all types for explicit imports when needed
export * from "./food";
export * from "./common";
export * from "./category";
export * from "./dialog";
export * from "./usage";

// This empty export makes this file a module
export {};
