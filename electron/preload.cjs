const { ipcRenderer, contextBridge } = require("electron");

const dataListeners = new Map();
const exitListeners = new Map();
const transferProgressListeners = new Map();
const transferCompleteListeners = new Map();
const transferErrorListeners = new Map();
const chainProgressListeners = new Map();
const authFailedListeners = new Map();
const languageChangeListeners = new Set();
const fullscreenChangeListeners = new Set();

ipcRenderer.on("smbcatty:data", (_event, payload) => {
  const set = dataListeners.get(payload.sessionId);
  if (!set) return;
  set.forEach((cb) => {
    try {
      cb(payload.data);
    } catch (err) {
      console.error("Data callback failed", err);
    }
  });
});

ipcRenderer.on("smbcatty:exit", (_event, payload) => {
  const set = exitListeners.get(payload.sessionId);
  if (set) {
    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error("Exit callback failed", err);
      }
    });
  }
  dataListeners.delete(payload.sessionId);
  exitListeners.delete(payload.sessionId);
});

// Chain progress events (for jump host connections)
ipcRenderer.on("smbcatty:chain:progress", (_event, payload) => {
  const { hop, total, label, status } = payload;
  // Notify all registered chain progress listeners
  chainProgressListeners.forEach((cb) => {
    try {
      cb(hop, total, label, status);
    } catch (err) {
      console.error("Chain progress callback failed", err);
    }
  });
});

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



// Authentication failed events
ipcRenderer.on("smbcatty:auth:failed", (_event, payload) => {
  const set = authFailedListeners.get(payload.sessionId);
  if (set) {
    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error("Auth failed callback failed", err);
      }
    });
  }
});

// Transfer progress events
ipcRenderer.on("smbcatty:transfer:progress", (_event, payload) => {
  const cb = transferProgressListeners.get(payload.transferId);
  if (cb) {
    try {
      cb(payload.transferred, payload.totalBytes, payload.speed);
    } catch (err) {
      console.error("Transfer progress callback failed", err);
    }
  }
});

ipcRenderer.on("smbcatty:transfer:complete", (_event, payload) => {
  const cb = transferCompleteListeners.get(payload.transferId);
  if (cb) {
    try {
      cb();
    } catch (err) {
      console.error("Transfer complete callback failed", err);
    }
  }
  // Cleanup listeners
  transferProgressListeners.delete(payload.transferId);
  transferCompleteListeners.delete(payload.transferId);
  transferErrorListeners.delete(payload.transferId);
});

ipcRenderer.on("smbcatty:transfer:error", (_event, payload) => {
  const cb = transferErrorListeners.get(payload.transferId);
  if (cb) {
    try {
      cb(payload.error);
    } catch (err) {
      console.error("Transfer error callback failed", err);
    }
  }
  // Cleanup listeners
  transferProgressListeners.delete(payload.transferId);
  transferCompleteListeners.delete(payload.transferId);
  transferErrorListeners.delete(payload.transferId);
});

ipcRenderer.on("smbcatty:transfer:cancelled", (_event, payload) => {
  // Just cleanup listeners, the UI already knows it's cancelled
  transferProgressListeners.delete(payload.transferId);
  transferCompleteListeners.delete(payload.transferId);
  transferErrorListeners.delete(payload.transferId);
});

// Upload with progress listeners
const uploadProgressListeners = new Map();
const uploadCompleteListeners = new Map();
const uploadErrorListeners = new Map();

ipcRenderer.on("smbcatty:upload:progress", (_event, payload) => {
  const cb = uploadProgressListeners.get(payload.transferId);
  if (cb) {
    try {
      cb(payload.transferred, payload.totalBytes, payload.speed);
    } catch (err) {
      console.error("Upload progress callback failed", err);
    }
  }
});

ipcRenderer.on("smbcatty:upload:complete", (_event, payload) => {
  const cb = uploadCompleteListeners.get(payload.transferId);
  if (cb) {
    try {
      cb();
    } catch (err) {
      console.error("Upload complete callback failed", err);
    }
  }
  // Cleanup listeners
  uploadProgressListeners.delete(payload.transferId);
  uploadCompleteListeners.delete(payload.transferId);
  uploadErrorListeners.delete(payload.transferId);
});

ipcRenderer.on("smbcatty:upload:error", (_event, payload) => {
  const cb = uploadErrorListeners.get(payload.transferId);
  if (cb) {
    try {
      cb(payload.error);
    } catch (err) {
      console.error("Upload error callback failed", err);
    }
  }
  // Cleanup listeners
  uploadProgressListeners.delete(payload.transferId);
  uploadCompleteListeners.delete(payload.transferId);
  uploadErrorListeners.delete(payload.transferId);
});

// Port forwarding status listeners
const portForwardStatusListeners = new Map();

ipcRenderer.on("smbcatty:portforward:status", (_event, payload) => {
  const { tunnelId, status, error } = payload;
  const callbacks = portForwardStatusListeners.get(tunnelId);
  if (callbacks) {
    callbacks.forEach((cb) => {
      try {
        cb(status, error);
      } catch (err) {
        console.error("Port forward status callback failed", err);
      }
    });
  }
});

const api = {
  startSSHSession: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:start", options);
    return result.sessionId;
  },
  startTelnetSession: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:telnet:start", options);
    return result.sessionId;
  },
  startMoshSession: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:mosh:start", options);
    return result.sessionId;
  },
  startLocalSession: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:local:start", options || {});
    return result.sessionId;
  },
  startSerialSession: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:serial:start", options);
    return result.sessionId;
  },
  listSerialPorts: async () => {
    return ipcRenderer.invoke("smbcatty:serial:list");
  },
  getDefaultShell: async () => {
    return ipcRenderer.invoke("smbcatty:local:defaultShell");
  },
  validatePath: async (path, type) => {
    return ipcRenderer.invoke("smbcatty:local:validatePath", { path, type });
  },
  writeToSession: (sessionId, data) => {
    ipcRenderer.send("smbcatty:write", { sessionId, data });
  },
  execCommand: async (options) => {
    return ipcRenderer.invoke("smbcatty:ssh:exec", options);
  },
  getSessionPwd: async (sessionId) => {
    return ipcRenderer.invoke("smbcatty:ssh:pwd", { sessionId });
  },
  generateKeyPair: async (options) => {
    return ipcRenderer.invoke("smbcatty:key:generate", options);
  },
  resizeSession: (sessionId, cols, rows) => {
    ipcRenderer.send("smbcatty:resize", { sessionId, cols, rows });
  },
  closeSession: (sessionId) => {
    ipcRenderer.send("smbcatty:close", { sessionId });
  },
  onSessionData: (sessionId, cb) => {
    if (!dataListeners.has(sessionId)) dataListeners.set(sessionId, new Set());
    dataListeners.get(sessionId).add(cb);
    return () => dataListeners.get(sessionId)?.delete(cb);
  },
  onSessionExit: (sessionId, cb) => {
    if (!exitListeners.has(sessionId)) exitListeners.set(sessionId, new Set());
    exitListeners.get(sessionId).add(cb);
    return () => exitListeners.get(sessionId)?.delete(cb);
  },
  onAuthFailed: (sessionId, cb) => {
    if (!authFailedListeners.has(sessionId)) authFailedListeners.set(sessionId, new Set());
    authFailedListeners.get(sessionId).add(cb);
    return () => authFailedListeners.get(sessionId)?.delete(cb);
  },
  openSftp: async (options) => {
    const result = await ipcRenderer.invoke("smbcatty:sftp:open", options);
    return result.sftpId;
  },
  listSftp: async (sftpId, path) => {
    return ipcRenderer.invoke("smbcatty:sftp:list", { sftpId, path });
  },
  readSftp: async (sftpId, path) => {
    return ipcRenderer.invoke("smbcatty:sftp:read", { sftpId, path });
  },
  writeSftp: async (sftpId, path, content) => {
    return ipcRenderer.invoke("smbcatty:sftp:write", { sftpId, path, content });
  },
  closeSftp: async (sftpId) => {
    return ipcRenderer.invoke("smbcatty:sftp:close", { sftpId });
  },
  mkdirSftp: async (sftpId, path) => {
    return ipcRenderer.invoke("smbcatty:sftp:mkdir", { sftpId, path });
  },
  deleteSftp: async (sftpId, path) => {
    return ipcRenderer.invoke("smbcatty:sftp:delete", { sftpId, path });
  },
  renameSftp: async (sftpId, oldPath, newPath) => {
    return ipcRenderer.invoke("smbcatty:sftp:rename", { sftpId, oldPath, newPath });
  },
  statSftp: async (sftpId, path) => {
    return ipcRenderer.invoke("smbcatty:sftp:stat", { sftpId, path });
  },
  chmodSftp: async (sftpId, path, mode) => {
    return ipcRenderer.invoke("smbcatty:sftp:chmod", { sftpId, path, mode });
  },
  // Write binary with real-time progress callback
  writeSftpBinaryWithProgress: async (sftpId, path, content, transferId, onProgress, onComplete, onError) => {
    // Register callbacks
    if (onProgress) uploadProgressListeners.set(transferId, onProgress);
    if (onComplete) uploadCompleteListeners.set(transferId, onComplete);
    if (onError) uploadErrorListeners.set(transferId, onError);
    
    return ipcRenderer.invoke("smbcatty:sftp:writeBinaryWithProgress", { 
      sftpId, 
      path, 
      content, 
      transferId 
    });
  },
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
  // Read system known_hosts file
  readKnownHosts: async () => {
    return ipcRenderer.invoke("smbcatty:known-hosts:read");
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
  // Streaming transfer with real progress
  startStreamTransfer: async (options, onProgress, onComplete, onError) => {
    const { transferId } = options;
    // Register callbacks
    if (onProgress) transferProgressListeners.set(transferId, onProgress);
    if (onComplete) transferCompleteListeners.set(transferId, onComplete);
    if (onError) transferErrorListeners.set(transferId, onError);
    
    return ipcRenderer.invoke("smbcatty:transfer:start", options);
  },
  cancelTransfer: async (transferId) => {
    // Cleanup listeners
    transferProgressListeners.delete(transferId);
    transferCompleteListeners.delete(transferId);
    transferErrorListeners.delete(transferId);
    return ipcRenderer.invoke("smbcatty:transfer:cancel", { transferId });
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
  
  // Port Forwarding API
  startPortForward: async (options) => {
    return ipcRenderer.invoke("smbcatty:portforward:start", options);
  },
  stopPortForward: async (tunnelId) => {
    return ipcRenderer.invoke("smbcatty:portforward:stop", { tunnelId });
  },
  getPortForwardStatus: async (tunnelId) => {
    return ipcRenderer.invoke("smbcatty:portforward:status", { tunnelId });
  },
  listPortForwards: async () => {
    return ipcRenderer.invoke("smbcatty:portforward:list");
  },
  onPortForwardStatus: (tunnelId, cb) => {
    if (!portForwardStatusListeners.has(tunnelId)) {
      portForwardStatusListeners.set(tunnelId, new Set());
    }
    portForwardStatusListeners.get(tunnelId).add(cb);
    return () => {
      portForwardStatusListeners.get(tunnelId)?.delete(cb);
      if (portForwardStatusListeners.get(tunnelId)?.size === 0) {
        portForwardStatusListeners.delete(tunnelId);
      }
    };
  },
  // Chain progress listener for jump host connections
  onChainProgress: (cb) => {
    const id = Date.now().toString() + Math.random().toString(16).slice(2);
    chainProgressListeners.set(id, cb);
    return () => {
      chainProgressListeners.delete(id);
    };
  },

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
  downloadSftpToTemp: (sftpId, remotePath, fileName) =>
    ipcRenderer.invoke("smbcatty:sftp:downloadToTemp", { sftpId, remotePath, fileName }),
};

// Merge with existing netcatty (if any) to avoid stale objects on hot reload
const existing = (typeof window !== "undefined" && window.smbcatty) ? window.smbcatty : {};
contextBridge.exposeInMainWorld("smbcatty", { ...existing, ...api });
