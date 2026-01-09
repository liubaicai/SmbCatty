const { ipcRenderer, contextBridge } = require("electron");

const languageChangeListeners = new Set();
const fullscreenChangeListeners = new Set();

ipcRenderer.on("smbcatty:languageChanged", (_event, language) => {
  languageChangeListeners.forEach((cb) => {
    try {
      cb(language);
    } catch (err) {
      console.error("Language changed callback failed", err);
    }
  });
});

ipcRenderer.on("smbcatty:window:fullscreen-changed", (_event, isFullscreen) => {
  fullscreenChangeListeners.forEach((cb) => {
    try {
      cb(isFullscreen);
    } catch (err) {
      console.error("Fullscreen changed callback failed", err);
    }
  });
});

const api = {
  // Local filesystem operations
  listLocalDir: async (path) => {
    return ipcRenderer.invoke("smbcatty:local:list", { path });
  },
  readLocalFile: async (path) => {
    return ipcRenderer.invoke("smbcatty:local:read", { path });
  },
  writeLocalFile: async (path, content) => {
    return ipcRenderer.invoke("smbcatty:local:write", { path, content });
  },
  deleteLocalFile: async (path) => {
    return ipcRenderer.invoke("smbcatty:local:delete", { path });
  },
  renameLocalFile: async (oldPath, newPath) => {
    return ipcRenderer.invoke("smbcatty:local:rename", { oldPath, newPath });
  },
  mkdirLocal: async (path) => {
    return ipcRenderer.invoke("smbcatty:local:mkdir", { path });
  },
  statLocal: async (path) => {
    return ipcRenderer.invoke("smbcatty:local:stat", { path });
  },
  getHomeDir: async () => {
    return ipcRenderer.invoke("smbcatty:local:homedir");
  },
  getSystemInfo: async () => {
    return ipcRenderer.invoke("smbcatty:system:info");
  },
  setTheme: async (theme) => {
    return ipcRenderer.invoke("smbcatty:setTheme", theme);
  },
  setBackgroundColor: async (color) => {
    return ipcRenderer.invoke("smbcatty:setBackgroundColor", color);
  },
  setLanguage: async (language) => {
    return ipcRenderer.invoke("smbcatty:setLanguage", language);
  },
  onLanguageChanged: (cb) => {
    languageChangeListeners.add(cb);
    return () => languageChangeListeners.delete(cb);
  },
  // Window controls for custom title bar
  windowMinimize: () => ipcRenderer.invoke("smbcatty:window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("smbcatty:window:maximize"),
  windowClose: () => ipcRenderer.invoke("smbcatty:window:close"),
  windowIsMaximized: () => ipcRenderer.invoke("smbcatty:window:isMaximized"),
  windowIsFullscreen: () => ipcRenderer.invoke("smbcatty:window:isFullscreen"),
  onWindowFullScreenChanged: (cb) => {
    fullscreenChangeListeners.add(cb);
    return () => fullscreenChangeListeners.delete(cb);
  },
  
  // Settings window
  openSettingsWindow: () => ipcRenderer.invoke("smbcatty:settings:open"),
  closeSettingsWindow: () => ipcRenderer.invoke("smbcatty:settings:close"),

  // Cross-window settings sync
  notifySettingsChanged: (payload) => ipcRenderer.send("smbcatty:settings:changed", payload),
  onSettingsChanged: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("smbcatty:settings:changed", handler);
    return () => ipcRenderer.removeListener("smbcatty:settings:changed", handler);
  },

  // Cloud sync session (in-memory only, shared across windows)
  cloudSyncSetSessionPassword: (password) =>
    ipcRenderer.invoke("smbcatty:cloudSync:session:setPassword", password),
  cloudSyncGetSessionPassword: () =>
    ipcRenderer.invoke("smbcatty:cloudSync:session:getPassword"),
  cloudSyncClearSessionPassword: () =>
    ipcRenderer.invoke("smbcatty:cloudSync:session:clearPassword"),

  // Cloud sync network operations (proxied via main process)
  cloudSyncWebdavInitialize: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:webdav:initialize", { config }),
  cloudSyncWebdavUpload: (config, syncedFile) =>
    ipcRenderer.invoke("smbcatty:cloudSync:webdav:upload", { config, syncedFile }),
  cloudSyncWebdavDownload: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:webdav:download", { config }),
  cloudSyncWebdavDelete: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:webdav:delete", { config }),

  cloudSyncS3Initialize: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:s3:initialize", { config }),
  cloudSyncS3Upload: (config, syncedFile) =>
    ipcRenderer.invoke("smbcatty:cloudSync:s3:upload", { config, syncedFile }),
  cloudSyncS3Download: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:s3:download", { config }),
  cloudSyncS3Delete: (config) =>
    ipcRenderer.invoke("smbcatty:cloudSync:s3:delete", { config }),
  
  // Open URL in default browser
  openExternal: (url) => ipcRenderer.invoke("smbcatty:openExternal", url),

  // App info
  getAppInfo: () => ipcRenderer.invoke("smbcatty:app:getInfo"),

  // Tell main process the renderer has mounted/painted (used to avoid initial blank screen).
  rendererReady: () => ipcRenderer.send("smbcatty:renderer:ready"),

  // OAuth callback server
  startOAuthCallback: (expectedState) => ipcRenderer.invoke("oauth:startCallback", expectedState),
  cancelOAuthCallback: () => ipcRenderer.invoke("oauth:cancelCallback"),

  // GitHub Device Flow (proxied via main process to avoid CORS)
  githubStartDeviceFlow: (options) => ipcRenderer.invoke("smbcatty:github:deviceFlow:start", options),
  githubPollDeviceFlowToken: (options) => ipcRenderer.invoke("smbcatty:github:deviceFlow:poll", options),

  // Google OAuth (proxied via main process to avoid CORS)
  googleExchangeCodeForTokens: (options) =>
    ipcRenderer.invoke("smbcatty:google:oauth:exchange", options),
  googleRefreshAccessToken: (options) =>
    ipcRenderer.invoke("smbcatty:google:oauth:refresh", options),
  googleGetUserInfo: (options) =>
    ipcRenderer.invoke("smbcatty:google:oauth:userinfo", options),

  // Google Drive API (proxied via main process to avoid CORS/COEP issues in renderer)
  googleDriveFindSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:google:drive:findSyncFile", options),
  googleDriveCreateSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:google:drive:createSyncFile", options),
  googleDriveUpdateSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:google:drive:updateSyncFile", options),
  googleDriveDownloadSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:google:drive:downloadSyncFile", options),
  googleDriveDeleteSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:google:drive:deleteSyncFile", options),

  // OneDrive OAuth + Graph (proxied via main process to avoid CORS)
  onedriveExchangeCodeForTokens: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:oauth:exchange", options),
  onedriveRefreshAccessToken: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:oauth:refresh", options),
  onedriveGetUserInfo: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:oauth:userinfo", options),
  onedriveFindSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:drive:findSyncFile", options),
  onedriveUploadSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:drive:uploadSyncFile", options),
  onedriveDownloadSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:drive:downloadSyncFile", options),
  onedriveDeleteSyncFile: (options) =>
    ipcRenderer.invoke("smbcatty:onedrive:drive:deleteSyncFile", options),

  // File opener helpers (for "Open With" feature)
  selectApplication: () =>
    ipcRenderer.invoke("smbcatty:selectApplication"),
  openWithApplication: (filePath, appPath) =>
    ipcRenderer.invoke("smbcatty:openWithApplication", { filePath, appPath }),
};

// Merge with existing smbcatty (if any) to avoid stale objects on hot reload
const existing = (typeof window !== "undefined" && window.smbcatty) ? window.smbcatty : {};
contextBridge.exposeInMainWorld("smbcatty", { ...existing, ...api });
