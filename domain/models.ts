// UI locale identifier, stored in settings and used for i18n (e.g., "en", "zh-CN").
export type UILanguage = string;

// SMB Host - represents an SMB/CIFS network share connection
export interface Host {
  id: string;
  label: string;
  hostname: string; // Server hostname or IP address
  port: number; // SMB port (default: 445)
  share: string; // SMB share name (e.g., "shared", "public")
  username: string;
  password?: string;
  domain?: string; // Windows domain (optional)
  group?: string; // Folder group for organizing hosts
  tags: string[];
  createdAt?: number; // Timestamp when host was created
}

export interface Snippet {
  id: string;
  label: string;
  command: string; // Multi-line script
  tags?: string[];
  package?: string; // package path
  targets?: string[]; // host ids
}

export interface GroupNode {
  name: string;
  path: string;
  children: Record<string, GroupNode>;
  hosts: Host[];
}

export interface SyncConfig {
  gistId: string;
  githubToken: string;
  gistToken?: string; // Alias for githubToken (deprecated, use githubToken)
  lastSync?: number;
}

// Keyboard Shortcuts / Hotkeys
export type HotkeyScheme = 'disabled' | 'mac' | 'pc';

export interface KeyBinding {
  id: string;
  action: string;
  label: string;
  mac: string; // e.g., '⌘+1', '⌘+⌥+arrows'
  pc: string; // e.g., 'Ctrl+1', 'Ctrl+Alt+arrows'
  category: 'tabs' | 'navigation' | 'app';
}

// User's custom key bindings - only stores overrides from defaults
export type CustomKeyBindings = Record<string, { mac?: string; pc?: string }>;

// Parse a key string like "⌘ + Shift + K" or "Ctrl + Alt + T" into normalized form
export const parseKeyCombo = (keyStr: string): { modifiers: string[]; key: string } | null => {
  if (!keyStr || keyStr === 'Disabled') return null;
  const parts = keyStr.split('+').map(p => p.trim());
  const key = parts.pop() || '';
  return { modifiers: parts, key };
};

// Convert keyboard event to a key string
export const keyEventToString = (e: KeyboardEvent, isMac: boolean): string => {
  const parts: string[] = [];
  
  if (isMac) {
    if (e.metaKey) parts.push('⌘');
    if (e.ctrlKey) parts.push('⌃');
    if (e.altKey) parts.push('⌥');
    if (e.shiftKey) parts.push('Shift');
  } else {
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Win');
  }
  
  // Get the key name
  let keyName = e.key;
  // Normalize special keys
  if (keyName === ' ') keyName = 'Space';
  else if (keyName === 'ArrowUp') keyName = '↑';
  else if (keyName === 'ArrowDown') keyName = '↓';
  else if (keyName === 'ArrowLeft') keyName = '←';
  else if (keyName === 'ArrowRight') keyName = '→';
  else if (keyName === 'Escape') keyName = 'Esc';
  else if (keyName === 'Backspace') keyName = '⌫';
  else if (keyName === 'Delete') keyName = 'Del';
  else if (keyName === 'Enter') keyName = '↵';
  else if (keyName === 'Tab') keyName = '⇥';
  else if (keyName.length === 1) keyName = keyName.toUpperCase();
  
  // Don't include modifier keys themselves
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
    return parts.join(' + ');
  }
  
  parts.push(keyName);
  return parts.join(' + ');
};

// Check if a keyboard event matches a key binding string
export const matchesKeyBinding = (e: KeyboardEvent, keyStr: string, isMac: boolean): boolean => {
  if (!keyStr || keyStr === 'Disabled') return false;
  
  // Handle range patterns like "[1...9]"
  if (keyStr.includes('[1...9]')) {
    const basePattern = keyStr.replace('[1...9]', '');
    const key = e.key;
    if (!/^[1-9]$/.test(key)) return false;
    // Check modifiers match the base pattern
    const testStr = basePattern + key;
    return matchesKeyBinding(e, testStr.trim(), isMac);
  }
  
  // Handle arrow key patterns like "arrows"
  if (keyStr.includes('arrows')) {
    const basePattern = keyStr.replace('arrows', '');
    const key = e.key;
    // Check if it's an arrow key
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return false;
    // Map arrow key to symbol for matching
    const arrowSymbol = key === 'ArrowUp' ? '↑' 
      : key === 'ArrowDown' ? '↓'
      : key === 'ArrowLeft' ? '←'
      : '→';
    // Check modifiers match the base pattern
    const testStr = basePattern + arrowSymbol;
    return matchesKeyBinding(e, testStr.trim(), isMac);
  }
  
  const parsed = parseKeyCombo(keyStr);
  if (!parsed) return false;
  
  const { modifiers, key } = parsed;
  
  // Check modifiers
  if (isMac) {
    const needMeta = modifiers.includes('⌘');
    const needCtrl = modifiers.includes('⌃');
    const needAlt = modifiers.includes('⌥');
    const needShift = modifiers.includes('Shift');
    
    if (e.metaKey !== needMeta) return false;
    if (e.ctrlKey !== needCtrl) return false;
    if (e.altKey !== needAlt) return false;
    if (e.shiftKey !== needShift) return false;
  } else {
    const needCtrl = modifiers.includes('Ctrl');
    const needAlt = modifiers.includes('Alt');
    const needShift = modifiers.includes('Shift');
    const needMeta = modifiers.includes('Win');
    
    if (e.ctrlKey !== needCtrl) return false;
    if (e.altKey !== needAlt) return false;
    if (e.shiftKey !== needShift) return false;
    if (e.metaKey !== needMeta) return false;
  }
  
  // Check key
  let eventKey = e.key;
  if (eventKey === ' ') eventKey = 'Space';
  else if (eventKey === 'ArrowUp') eventKey = '↑';
  else if (eventKey === 'ArrowDown') eventKey = '↓';
  else if (eventKey === 'ArrowLeft') eventKey = '←';
  else if (eventKey === 'ArrowRight') eventKey = '→';
  else if (eventKey === 'Escape') eventKey = 'Esc';
  else if (eventKey === '[') eventKey = '[';
  else if (eventKey === ']') eventKey = ']';
  
  return eventKey.toLowerCase() === key.toLowerCase();
};

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // Tab Management
  { id: 'switch-tab-1-9', action: 'switchToTab', label: 'Switch to Tab [1...9]', mac: '⌘ + [1...9]', pc: 'Ctrl + [1...9]', category: 'tabs' },
  { id: 'next-tab', action: 'nextTab', label: 'Next Tab', mac: '⌘ + Shift + ]', pc: 'Ctrl + Tab', category: 'tabs' },
  { id: 'prev-tab', action: 'prevTab', label: 'Previous Tab', mac: '⌘ + Shift + [', pc: 'Ctrl + Shift + Tab', category: 'tabs' },
  { id: 'close-tab', action: 'closeTab', label: 'Close Tab', mac: '⌘ + W', pc: 'Ctrl + W', category: 'tabs' },

  // App Features
  { id: 'open-hosts', action: 'openHosts', label: 'Open Hosts Page', mac: 'Disabled', pc: 'Disabled', category: 'app' },
  { id: 'open-smb', action: 'openSmb', label: 'Open SMB Browser', mac: '⌘ + Shift + S', pc: 'Ctrl + Shift + S', category: 'app' },
  { id: 'command-palette', action: 'commandPalette', label: 'Open Command Palette', mac: '⌘ + K', pc: 'Ctrl + K', category: 'app' },
  { id: 'quick-switch', action: 'quickSwitch', label: 'Quick Switch', mac: '⌘ + J', pc: 'Ctrl + J', category: 'app' },
];

export interface RemoteFile {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: string;
  lastModified: string;
  linkTarget?: 'file' | 'directory' | null; // For symlinks: the type of the target, or null if broken
  permissions?: string; // rwx format for owner/group/others e.g. "rwxr-xr-x"
}

// SMB Types - for file browsing
export interface SmbFileEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
  sizeFormatted: string;
  lastModified: number;
  lastModifiedFormatted: string;
  permissions?: string;
}

export interface SmbConnection {
  id: string;
  hostId: string;
  hostLabel: string;
  isLocal: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
  currentPath: string;
  homeDir?: string;
}

export type TransferStatus = 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled';
export type TransferDirection = 'upload' | 'download' | 'remote-to-remote' | 'local-copy';

export interface TransferTask {
  id: string;
  fileName: string;
  sourcePath: string;
  targetPath: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  direction: TransferDirection;
  status: TransferStatus;
  totalBytes: number;
  transferredBytes: number;
  speed: number; // bytes per second
  error?: string;
  startTime: number;
  endTime?: number;
  isDirectory: boolean;
  childTasks?: string[]; // For directory transfers
  parentTaskId?: string;
  skipConflictCheck?: boolean; // Skip conflict check for replace operations
}

export interface FileConflict {
  transferId: string;
  fileName: string;
  sourcePath: string;
  targetPath: string;
  existingSize: number;
  newSize: number;
  existingModified: number;
  newModified: number;
}

// Connection Log - records connection history
export interface ConnectionLog {
  id: string;
  hostId: string; // Host ID (can be empty for local)
  hostLabel: string; // Display label
  hostname: string; // Target hostname
  username: string; // Username
  protocol: 'smb';
  startTime: number; // Connection start timestamp
  endTime?: number; // Connection end timestamp (undefined if still active)
  localUsername: string; // System username of the local user
  localHostname: string; // Local machine hostname
  saved: boolean; // Whether this log is bookmarked/saved
}

// Legacy types kept for compatibility during migration
// These will be removed after the refactoring is complete
export type HostProtocol = 'smb';
export type KeyType = 'RSA' | 'ECDSA' | 'ED25519';
export type KeySource = 'generated' | 'imported';
export type KeyCategory = 'key' | 'certificate' | 'identity';
export type IdentityAuthMethod = 'password';

export interface SSHKey {
  id: string;
  label: string;
  type: KeyType;
  keySize?: number;
  privateKey: string;
  publicKey?: string;
  certificate?: string;
  passphrase?: string;
  savePassphrase?: boolean;
  source: KeySource;
  category: KeyCategory;
  created: number;
}

export interface Identity {
  id: string;
  label: string;
  username: string;
  authMethod: IdentityAuthMethod;
  password?: string;
  keyId?: string;
  created: number;
}

// Legacy terminal types kept for compatibility during migration
export interface TerminalTheme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  }
}

export interface TerminalSettings {
  scrollback: number;
  drawBoldInBrightColors: boolean;
  terminalEmulationType: string;
  fontLigatures: boolean;
  fontWeight: number;
  fontWeightBold: number;
  linePadding: number;
  fallbackFont: string;
  cursorShape: string;
  cursorBlink: boolean;
  minimumContrastRatio: number;
  altAsMeta: boolean;
  scrollOnInput: boolean;
  scrollOnOutput: boolean;
  scrollOnKeyPress: boolean;
  scrollOnPaste: boolean;
  rightClickBehavior: string;
  copyOnSelect: boolean;
  middleClickPaste: boolean;
  wordSeparators: string;
  linkModifier: string;
  keywordHighlightEnabled: boolean;
  keywordHighlightRules: KeywordHighlightRule[];
  localShell: string;
  localStartDir: string;
  keepaliveInterval: number;
}

export interface KeywordHighlightRule {
  id: string;
  label: string;
  patterns: string[];
  color: string;
  enabled: boolean;
}

export const DEFAULT_KEYWORD_HIGHLIGHT_RULES: KeywordHighlightRule[] = [];
export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  scrollback: 10000,
  drawBoldInBrightColors: true,
  terminalEmulationType: 'xterm-256color',
  fontLigatures: true,
  fontWeight: 400,
  fontWeightBold: 700,
  linePadding: 0,
  fallbackFont: '',
  cursorShape: 'block',
  cursorBlink: true,
  minimumContrastRatio: 1,
  altAsMeta: false,
  scrollOnInput: true,
  scrollOnOutput: false,
  scrollOnKeyPress: false,
  scrollOnPaste: true,
  rightClickBehavior: 'context-menu',
  copyOnSelect: false,
  middleClickPaste: true,
  wordSeparators: ' ()[]{}\'"',
  linkModifier: 'none',
  keywordHighlightEnabled: false,
  keywordHighlightRules: [],
  localShell: '',
  localStartDir: '',
  keepaliveInterval: 0,
};

// Legacy types - kept for compatibility
export interface TerminalSession {
  id: string;
  hostId: string;
  hostLabel: string;
  username: string;
  hostname: string;
  status: 'connecting' | 'connected' | 'disconnected';
  workspaceId?: string;
  startupCommand?: string;
  protocol?: 'smb';
  port?: number;
}

export interface Workspace {
  id: string;
  title: string;
  root: WorkspaceNode;
  viewMode?: WorkspaceViewMode;
  focusedSessionId?: string;
  snippetId?: string;
}

export type WorkspaceNode =
  | {
      id: string;
      type: 'pane';
      sessionId: string;
    }
  | {
      id: string;
      type: 'split';
      direction: 'horizontal' | 'vertical';
      children: WorkspaceNode[];
      sizes?: number[];
    };

export type WorkspaceViewMode = 'split' | 'focus';

// Legacy SFTP types renamed for SMB
export interface SftpFileEntry extends SmbFileEntry {}
export interface SftpConnection extends SmbConnection {}

// Port forwarding - removed for SMB client
export type PortForwardingType = 'local' | 'remote' | 'dynamic';
export type PortForwardingStatus = 'inactive' | 'connecting' | 'active' | 'error';

export interface PortForwardingRule {
  id: string;
  label: string;
  type: PortForwardingType;
  localPort: number;
  bindAddress: string;
  remoteHost?: string;
  remotePort?: number;
  hostId?: string;
  autoStart?: boolean;
  status: PortForwardingStatus;
  error?: string;
  createdAt: number;
  lastUsedAt?: number;
}

// Known hosts - not applicable for SMB but kept for type compatibility
export interface KnownHost {
  id: string;
  hostname: string;
  port: number;
  keyType: string;
  publicKey: string;
  discoveredAt: number;
  lastSeen?: number;
  convertedToHostId?: string;
}

export interface ShellHistoryEntry {
  id: string;
  command: string;
  hostId: string;
  hostLabel: string;
  sessionId: string;
  timestamp: number;
}
