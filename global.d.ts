import type { S3Config,SMBConfig,SyncedFile,WebDAVConfig } from "./domain/sync";
import type { RemoteFile } from "./types";

declare global {

// SMB Host configuration for connections
export interface SmbCattyHost {
  hostname: string;
  port: number;
  share: string;
  username: string;
  password?: string;
  domain?: string;
}

interface SmbCattyBridge {
  // SMB operations
  openSmb?(options: {
    hostname: string;
    port?: number;
    share: string;
    username: string;
    password?: string;
    domain?: string;
  }): Promise<string>;
  listSmb?(smbId: string, path: string): Promise<RemoteFile[]>;
  readSmb?(smbId: string, path: string): Promise<string>;
  writeSmb?(smbId: string, path: string, content: string): Promise<void>;
  closeSmb?(smbId: string): Promise<void>;
  mkdirSmb?(smbId: string, path: string): Promise<void>;
  deleteSmb?(smbId: string, path: string): Promise<void>;
  renameSmb?(smbId: string, oldPath: string, newPath: string): Promise<void>;
  
  // Local filesystem operations
  listLocalDir?(path: string): Promise<RemoteFile[]>;
  readLocalFile?(path: string): Promise<ArrayBuffer>;
  writeLocalFile?(path: string, content: ArrayBuffer): Promise<void>;
  deleteLocalFile?(path: string): Promise<void>;
  renameLocalFile?(oldPath: string, newPath: string): Promise<void>;
  mkdirLocal?(path: string): Promise<void>;
  getHomeDir?(): Promise<string>;
  getSystemInfo?(): Promise<{ username: string; hostname: string }>;
  
  setTheme?(theme: 'light' | 'dark'): Promise<boolean>;
  setBackgroundColor?(color: string): Promise<boolean>;
  setLanguage?(language: string): Promise<boolean>;
  
  // Window controls for custom title bar (Windows/Linux)
  windowMinimize?(): Promise<void>;
  windowMaximize?(): Promise<boolean>;
  windowClose?(): Promise<void>;
  windowIsMaximized?(): Promise<boolean>;
  windowIsFullscreen?(): Promise<boolean>;
  onWindowFullScreenChanged?(cb: (isFullscreen: boolean) => void): () => void;
  
  // Settings window
  openSettingsWindow?(): Promise<boolean>;
  closeSettingsWindow?(): Promise<void>;

  // Cross-window settings sync
  notifySettingsChanged?(payload: { key: string; value: unknown }): void;
  onSettingsChanged?(cb: (payload: { key: string; value: unknown }) => void): () => void;

  // Cloud sync master password (stored in-memory + persisted via Electron safeStorage)
  cloudSyncSetSessionPassword?(password: string): Promise<boolean>;
  cloudSyncGetSessionPassword?(): Promise<string | null>;
  cloudSyncClearSessionPassword?(): Promise<boolean>;

  // Cloud sync network operations (proxied via main process)
  cloudSyncWebdavInitialize?(config: WebDAVConfig): Promise<{ resourceId: string | null }>;
  cloudSyncWebdavUpload?(
    config: WebDAVConfig,
    syncedFile: SyncedFile
  ): Promise<{ resourceId: string }>;
  cloudSyncWebdavDownload?(config: WebDAVConfig): Promise<{ syncedFile: SyncedFile | null }>;
  cloudSyncWebdavDelete?(config: WebDAVConfig): Promise<{ ok: true }>;

  cloudSyncS3Initialize?(config: S3Config): Promise<{ resourceId: string | null }>;
  cloudSyncS3Upload?(
    config: S3Config,
    syncedFile: SyncedFile
  ): Promise<{ resourceId: string }>;
  cloudSyncS3Download?(config: S3Config): Promise<{ syncedFile: SyncedFile | null }>;
  cloudSyncS3Delete?(config: S3Config): Promise<{ ok: true }>;

  cloudSyncSmbInitialize?(config: SMBConfig): Promise<{ resourceId: string | null }>;
  cloudSyncSmbUpload?(
    config: SMBConfig,
    syncedFile: SyncedFile
  ): Promise<{ resourceId: string }>;
  cloudSyncSmbDownload?(config: SMBConfig): Promise<{ syncedFile: SyncedFile | null }>;
  cloudSyncSmbDelete?(config: SMBConfig): Promise<{ ok: true }>;
  
  // Open URL in default browser
  openExternal?(url: string): Promise<void>;

  // App info (name/version/platform) for About screens
  getAppInfo?(): Promise<{ name: string; version: string; platform: string }>;

  // Notify main process the renderer has mounted/painted (used to avoid initial blank screen).
  rendererReady?(): void;

  onLanguageChanged?(cb: (language: string) => void): () => void;

  // OAuth callback server for cloud sync
  startOAuthCallback?(expectedState?: string): Promise<{ code: string; state?: string }>;
  cancelOAuthCallback?(): Promise<void>;

  // GitHub Device Flow (cloud sync)
  githubStartDeviceFlow?(options?: { clientId?: string; scope?: string }): Promise<{
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    expiresAt: number;
    interval: number;
  }>;
  githubPollDeviceFlowToken?(options: { clientId?: string; deviceCode: string }): Promise<{
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  }>;

  // Google OAuth (cloud sync) - proxied via main process to avoid CORS
  googleExchangeCodeForTokens?(options: {
    clientId: string;
    clientSecret?: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType: string;
    scope?: string;
  }>;
  googleRefreshAccessToken?(options: {
    clientId: string;
    clientSecret?: string;
    refreshToken: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
    tokenType: string;
    scope?: string;
  }>;
  googleGetUserInfo?(options: { accessToken: string }): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }>;

  // Google Drive API (cloud sync) - proxied via main process to avoid CORS/COEP issues
  googleDriveFindSyncFile?(options: { accessToken: string; fileName?: string }): Promise<{ fileId: string | null }>;
  googleDriveCreateSyncFile?(options: { accessToken: string; fileName?: string; syncedFile: unknown }): Promise<{ fileId: string }>;
  googleDriveUpdateSyncFile?(options: { accessToken: string; fileId: string; syncedFile: unknown }): Promise<{ ok: true }>;
  googleDriveDownloadSyncFile?(options: { accessToken: string; fileId: string }): Promise<{ syncedFile: unknown | null }>;
  googleDriveDeleteSyncFile?(options: { accessToken: string; fileId: string }): Promise<{ ok: true }>;

  // OneDrive OAuth + Graph (cloud sync) - proxied via main process to avoid CORS
  onedriveExchangeCodeForTokens?(options: {
    clientId: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
    scope?: string;
  }): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType: string;
    scope?: string;
  }>;
  onedriveRefreshAccessToken?(options: {
    clientId: string;
    refreshToken: string;
    scope?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
    tokenType: string;
    scope?: string;
  }>;
  onedriveGetUserInfo?(options: { accessToken: string }): Promise<{
    id: string;
    email: string;
    name: string;
    avatarDataUrl?: string;
  }>;
  onedriveFindSyncFile?(options: { accessToken: string; fileName?: string }): Promise<{ fileId: string | null }>;
  onedriveUploadSyncFile?(options: { accessToken: string; fileName?: string; syncedFile: unknown }): Promise<{ fileId: string | null }>;
  onedriveDownloadSyncFile?(options: { accessToken: string; fileId?: string; fileName?: string }): Promise<{ syncedFile: unknown | null }>;
  onedriveDeleteSyncFile?(options: { accessToken: string; fileId: string }): Promise<{ ok: true }>;

  // File opener helpers
  selectApplication?(): Promise<{ path: string; name: string } | null>;
  openWithApplication?(filePath: string, appPath: string): Promise<boolean>;
}

interface Window {
  smbcatty?: SmbCattyBridge;
}

}

export { };
