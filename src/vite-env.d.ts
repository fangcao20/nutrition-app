/// <reference types="../../types/common" />

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare global {
  interface Window {
    electronAPI: import("../../types/common").ElectronAPI;
  }
}
