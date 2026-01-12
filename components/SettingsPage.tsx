import React from 'react';
import { useSettingsState } from '../application/state/useSettingsState';
import { useVaultState } from '../application/state/useVaultState';
import SettingsAppearanceTab from './settings/tabs/SettingsAppearanceTab';
import SettingsShortcutsTab from './settings/tabs/SettingsShortcutsTab';
import SettingsSyncTab from './settings/tabs/SettingsSyncTab';

const tabs = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'sync', label: 'Cloud Sync' },
] as const;

type TabId = typeof tabs[number]['id'];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('appearance');
  
  const {
    theme,
    setTheme,
    lightUiThemeId,
    setLightUiThemeId,
    darkUiThemeId,
    setDarkUiThemeId,
    accentMode,
    setAccentMode,
    customAccent,
    setCustomAccent,
    uiLanguage,
    setUiLanguage,
    customCSS,
    setCustomCSS,
    hotkeyScheme,
    setHotkeyScheme,
    keyBindings,
    updateKeyBinding,
    resetKeyBinding,
    resetAllKeyBindings,
    setIsHotkeyRecording,
  } = useSettingsState();

  const {
    hosts,
    keys,
    identities,
    snippets,
    importDataFromString,
    clearVaultData,
  } = useVaultState();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>
      
      <div className="flex flex-1 min-h-0">
        <div className="w-48 border-r p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'appearance' && (
            <SettingsAppearanceTab
              theme={theme}
              setTheme={setTheme}
              lightUiThemeId={lightUiThemeId}
              setLightUiThemeId={setLightUiThemeId}
              darkUiThemeId={darkUiThemeId}
              setDarkUiThemeId={setDarkUiThemeId}
              accentMode={accentMode}
              setAccentMode={setAccentMode}
              customAccent={customAccent}
              setCustomAccent={setCustomAccent}
              uiLanguage={uiLanguage}
              setUiLanguage={setUiLanguage}
              customCSS={customCSS}
              setCustomCSS={setCustomCSS}
            />
          )}
          {activeTab === 'shortcuts' && (
            <SettingsShortcutsTab
              hotkeyScheme={hotkeyScheme}
              setHotkeyScheme={setHotkeyScheme}
              keyBindings={keyBindings}
              updateKeyBinding={updateKeyBinding}
              resetKeyBinding={resetKeyBinding}
              resetAllKeyBindings={resetAllKeyBindings}
              setIsHotkeyRecording={setIsHotkeyRecording}
            />
          )}
          {activeTab === 'sync' && (
            <SettingsSyncTab
              hosts={hosts}
              keys={keys}
              identities={identities}
              snippets={snippets}
              importDataFromString={importDataFromString}
              clearVaultData={clearVaultData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
