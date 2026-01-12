import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useIsVaultActive } from './application/state/activeTabStore';
import { useAutoSync } from './application/state/useAutoSync';
import { useSettingsState } from './application/state/useSettingsState';
import { useUpdateCheck } from './application/state/useUpdateCheck';
import { useVaultState } from './application/state/useVaultState';
import { useWindowControls } from './application/state/useWindowControls';
import { initializeFonts } from './application/state/fontStore';
import { I18nProvider, useI18n } from './application/i18n/I18nProvider';
import { matchesKeyBinding } from './domain/models';
import { smbcattyBridge } from './infrastructure/services/smbcattyBridge';
import { TopTabs } from './components/TopTabs';
import { ToastProvider, toast } from './components/ui/toast';
import { VaultView, VaultSection } from './components/VaultView';
import { cn } from './lib/utils';
import { Host } from './types';

const LazyQuickSwitcher = lazy(() =>
  import('./components/QuickSwitcher').then((m) => ({ default: m.QuickSwitcher })),
);

// Initialize fonts eagerly at app startup
initializeFonts();

// Visibility container for VaultView - isolates isActive subscription
const VaultViewContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isActive = useIsVaultActive();
  const containerStyle: React.CSSProperties = isActive
    ? {}
    : { visibility: 'hidden', pointerEvents: 'none', position: 'absolute', zIndex: -1 };

  return (
    <div className={cn("absolute inset-0", isActive ? "z-20" : "")} style={containerStyle}>
      {children}
    </div>
  );
};

const IS_DEV = import.meta.env.DEV;
const HOTKEY_DEBUG =
  IS_DEV &&
  typeof window !== "undefined" &&
  window.localStorage?.getItem("debug.hotkeys") === "1";

type SettingsState = ReturnType<typeof useSettingsState>;

function App({ settings }: { settings: SettingsState }) {
  const { t } = useI18n();

  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  // Navigation state for VaultView sections
  const [navigateToSection, setNavigateToSection] = useState<VaultSection | null>(null);
  const [_activeTabId, setActiveTabId] = useState('vault');

  const {
    theme,
    setTheme,
    hotkeyScheme,
    keyBindings,
    isHotkeyRecording,
  } = settings;

  const {
    hosts,
    keys,
    identities,
    snippets,
    customGroups,
    snippetPackages,
    knownHosts,
    shellHistory,
    connectionLogs,
    updateHosts,
    updateKeys,
    updateIdentities,
    updateSnippets,
    updateSnippetPackages,
    updateCustomGroups,
    updateKnownHosts,
    toggleConnectionLogSaved,
    deleteConnectionLog,
    clearUnsavedConnectionLogs,
    convertKnownHostToHost,
    importDataFromString,
  } = useVaultState();

  // isMacClient is used for window controls styling
  const isMacClient = typeof navigator !== 'undefined' && /Mac|Macintosh/.test(navigator.userAgent);

  // Auto-sync hook for cloud sync
  const { syncNow: handleSyncNow } = useAutoSync({
    hosts,
    keys,
    identities,
    snippets,
    customGroups,
    portForwardingRules: undefined,
    knownHosts,
    onApplyPayload: (payload) => {
      importDataFromString(JSON.stringify({
        hosts: payload.hosts,
        keys: payload.keys,
        identities: payload.identities,
        snippets: payload.snippets,
        customGroups: payload.customGroups,
      }));
    },
  });

  const handleSyncNowManual = useCallback(() => {
    return handleSyncNow({ trigger: 'manual' });
  }, [handleSyncNow]);

  // Update check hook - checks for new versions on startup
  const { updateState, openReleasePage, dismissUpdate } = useUpdateCheck();

  // Show toast notification when update is available
  useEffect(() => {
    if (updateState.hasUpdate && updateState.latestRelease) {
      const version = updateState.latestRelease.version;
      toast.info(
        t('update.available.message', { version }),
        {
          title: t('update.available.title'),
          duration: 8000, // Show longer for update notifications
          onClick: () => {
            openReleasePage();
            dismissUpdate();
          },
          actionLabel: t('update.downloadNow'),
        }
      );
    }
  }, [updateState.hasUpdate, updateState.latestRelease, t, openReleasePage, dismissUpdate]);

  // Shared hotkey action handler
  const executeHotkeyAction = useCallback((action: string, _e: KeyboardEvent) => {
    switch (action) {
      case 'openHosts':
        setActiveTabId('vault');
        break;
      case 'quickSwitch':
      case 'commandPalette':
        setIsQuickSwitcherOpen(true);
        break;
      case 'snippets':
        // Navigate to vault and open snippets section
        setActiveTabId('vault');
        setNavigateToSection('snippets');
        break;
    }
  }, []);

  // Global hotkey handler
  useEffect(() => {
    if (hotkeyScheme === 'disabled' || isHotkeyRecording) return;

    const isMac = hotkeyScheme === 'mac';
    if (HOTKEY_DEBUG) {
      console.log('[Hotkeys] Registering global hotkey handler, scheme:', hotkeyScheme, 'bindings count:', keyBindings.length);
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle if we're in an input or textarea (except for Escape)
      const target = e.target as HTMLElement;
      const isFormElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isFormElement && e.key !== 'Escape') {
        return;
      }

      // Check each key binding
      for (const binding of keyBindings) {
        const keyStr = isMac ? binding.mac : binding.pc;
        if (matchesKeyBinding(e, keyStr, isMac)) {
          if (HOTKEY_DEBUG) console.log('[Hotkeys] Matched binding:', binding.action, keyStr);

          e.preventDefault();
          e.stopPropagation();
          executeHotkeyAction(binding.action, e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [hotkeyScheme, keyBindings, isHotkeyRecording, executeHotkeyAction]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickSwitcherOpen) {
        setIsQuickSwitcherOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isQuickSwitcherOpen]);

  const quickResults = useMemo(() => {
    if (!isQuickSwitcherOpen) return [];
    const term = quickSearch.trim().toLowerCase();
    const filtered = term
      ? hosts.filter(h =>
        h.label.toLowerCase().includes(term) ||
        h.hostname.toLowerCase().includes(term) ||
        (h.group || '').toLowerCase().includes(term)
      )
      : hosts;
    return filtered.slice(0, 8);
  }, [hosts, quickSearch, isQuickSwitcherOpen]);

  const handleDeleteHost = useCallback((hostId: string) => {
    const target = hosts.find(h => h.id === hostId);
    const confirmed = window.confirm(t('confirm.deleteHost', { name: target?.label || hostId }));
    if (!confirmed) return;
    updateHosts(hosts.filter(h => h.id !== hostId));
  }, [hosts, updateHosts, t]);

  // Handle host connection (placeholder for SMB connection)
  const handleConnectToHost = useCallback((host: Host) => {
    // TODO: Implement SMB connection
    console.log('Connect to SMB host:', host.hostname, host.share);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const handleOpenQuickSwitcher = useCallback(() => {
    setIsQuickSwitcherOpen(true);
  }, []);

  const { openSettingsWindow } = useWindowControls();

  const handleOpenSettings = useCallback(() => {
    void (async () => {
      const opened = await openSettingsWindow();
      if (!opened) toast.error(t('toast.settingsUnavailable'), t('common.settings'));
    })();
  }, [openSettingsWindow, t]);

  return (
    <div className="flex flex-col h-screen text-foreground font-sans smbcatty-shell" onContextMenu={(e) => e.preventDefault()}>
      <TopTabs
        theme={theme}
        sessions={[]}
        orphanSessions={[]}
        workspaces={[]}
        logViews={[]}
        orderedTabs={[]}
        draggingSessionId={null}
        isMacClient={isMacClient}
        onCloseSession={() => {}}
        onRenameSession={() => {}}
        onRenameWorkspace={() => {}}
        onCloseWorkspace={() => {}}
        onCloseLogView={() => {}}
        onOpenQuickSwitcher={handleOpenQuickSwitcher}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={handleOpenSettings}
        onSyncNow={handleSyncNowManual}
        onStartSessionDrag={() => {}}
        onEndSessionDrag={() => {}}
        onReorderTabs={() => {}}
      />

      <div className="flex-1 relative min-h-0">
        <VaultViewContainer>
          <VaultView
            hosts={hosts}
            keys={keys}
            identities={identities}
            snippets={snippets}
            snippetPackages={snippetPackages}
            customGroups={customGroups}
            knownHosts={knownHosts}
            shellHistory={shellHistory}
            connectionLogs={connectionLogs}
            onOpenSettings={handleOpenSettings}
            onOpenQuickSwitcher={handleOpenQuickSwitcher}
            onDeleteHost={handleDeleteHost}
            onConnect={handleConnectToHost}
            onUpdateHosts={updateHosts}
            onUpdateKeys={updateKeys}
            onUpdateIdentities={updateIdentities}
            onUpdateSnippets={updateSnippets}
            onUpdateSnippetPackages={updateSnippetPackages}
            onUpdateCustomGroups={updateCustomGroups}
            onUpdateKnownHosts={updateKnownHosts}
            onConvertKnownHost={convertKnownHostToHost}
            onToggleConnectionLogSaved={toggleConnectionLogSaved}
            onDeleteConnectionLog={deleteConnectionLog}
            onClearUnsavedConnectionLogs={clearUnsavedConnectionLogs}
            onRunSnippet={() => {}}
            onOpenLogView={() => {}}
            navigateToSection={navigateToSection}
            onNavigateToSectionHandled={() => setNavigateToSection(null)}
          />
        </VaultViewContainer>
      </div>

      {isQuickSwitcherOpen && (
        <Suspense fallback={null}>
          <LazyQuickSwitcher
            isOpen={isQuickSwitcherOpen}
            query={quickSearch}
            results={quickResults}
            sessions={[]}
            workspaces={[]}
            onQueryChange={setQuickSearch}
            onSelect={(host) => {
              handleConnectToHost(host);
              setIsQuickSwitcherOpen(false);
              setQuickSearch('');
            }}
            onSelectTab={(tabId) => {
              setActiveTabId(tabId);
              setIsQuickSwitcherOpen(false);
              setQuickSearch('');
            }}
            onCreateWorkspace={() => {
              setIsQuickSwitcherOpen(false);
            }}
            onClose={() => {
              setIsQuickSwitcherOpen(false);
              setQuickSearch('');
            }}
            keyBindings={keyBindings}
          />
        </Suspense>
      )}
    </div>
  );
}

function AppWithProviders() {
  const settings = useSettingsState();

  useEffect(() => {
    try {
      // Hide splash screen with a fade-out animation
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('fade-out');
        // Remove from DOM after animation completes
        setTimeout(() => splash.remove(), 200);
      }
      // Notify main process that renderer is ready
      smbcattyBridge.get()?.rendererReady?.();
    } catch {
      // ignore
    }
  }, []);

  return (
    <I18nProvider locale={settings.uiLanguage}>
      <ToastProvider>
        <App settings={settings} />
      </ToastProvider>
    </I18nProvider>
  );
}

export default AppWithProviders;
