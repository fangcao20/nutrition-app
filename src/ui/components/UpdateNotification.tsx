import React, { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Listen for update events from electron
    if (window.electronAPI) {
      window.electronAPI.update.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateAvailable(info);
      });

      window.electronAPI.update.onUpdateProgress((progressInfo: ProgressInfo) => {
        setProgress(progressInfo);
        setDownloading(true);
      });

      window.electronAPI.update.onUpdateDownloaded(() => {
        setUpdateReady(true);
        setDownloading(false);
      });
    }
  }, []);

  const handleDownloadUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.update.downloadUpdate();
      setDownloading(true);
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.update.installUpdate();
    }
  };

  if (updateReady) {
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold">Update Ready!</h3>
        <p>The app will restart to apply the update.</p>
        <button
          onClick={handleInstallUpdate}
          className="mt-2 bg-green-700 hover:bg-green-800 px-4 py-2 rounded"
        >
          Restart Now
        </button>
      </div>
    );
  }

  if (downloading && progress) {
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold">Downloading Update...</h3>
        <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-800 h-2.5 rounded-full"
            style={{ width: `${progress.percent}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1">{Math.round(progress.percent)}%</p>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold">Update Available!</h3>
        <p>Version {updateAvailable.version} is ready to download.</p>
        <div className="mt-2 space-x-2">
          <button
            onClick={handleDownloadUpdate}
            className="bg-yellow-700 hover:bg-yellow-800 px-4 py-2 rounded"
          >
            Download
          </button>
          <button
            onClick={() => setUpdateAvailable(null)}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            Later
          </button>
        </div>
      </div>
    );
  }

  return null;
}