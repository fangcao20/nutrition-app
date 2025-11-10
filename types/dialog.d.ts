interface DialogAPI {
  showOpenDialog: (options: any) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  showSaveDialog: (options: any) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
}

type DialogEventPayloadMapping = {
  "dialog:showOpenDialog": {
    canceled: boolean;
    filePaths: string[];
  };
  "dialog:showSaveDialog": {
    canceled: boolean;
    filePath?: string;
  };
};