import React, { memo, useCallback, useState } from "react";
import { useI18n } from "../application/i18n/I18nProvider";
import { sanitizeHost } from "../domain/host";
import { cn } from "../lib/utils";
import {
  ConnectionLog,
  Host,
  Identity,
  KnownHost,
  SSHKey,
  ShellHistoryEntry,
  Snippet,
} from "../types";
import { AppLogo } from "./AppLogo";
import HostDetailsPanel from "./HostDetailsPanel";
import SnippetsManager from "./SnippetsManager";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "./ui/toast";
import {
  FolderOpen,
  Plus,
  Search,
  Settings,
  Zap,
} from "lucide-react";

export type VaultSection = "hosts" | "snippets";

interface VaultViewProps {
  hosts: Host[];
  keys: SSHKey[];
  identities: Identity[];
  snippets: Snippet[];
  snippetPackages: string[];
  customGroups: string[];
  knownHosts: KnownHost[];
  shellHistory: ShellHistoryEntry[];
  connectionLogs: ConnectionLog[];
  onOpenSettings: () => void;
  onOpenQuickSwitcher: () => void;
  onDeleteHost: (hostId: string) => void;
  onConnect: (host: Host) => void;
  onUpdateHosts: (hosts: Host[]) => void;
  onUpdateKeys: (keys: SSHKey[]) => void;
  onUpdateIdentities: (identities: Identity[]) => void;
  onUpdateSnippets: (snippets: Snippet[]) => void;
  onUpdateSnippetPackages: (packages: string[]) => void;
  onUpdateCustomGroups: (groups: string[]) => void;
  onUpdateKnownHosts: (hosts: KnownHost[]) => void;
  onConvertKnownHost: (host: KnownHost) => Host;
  onToggleConnectionLogSaved: (logId: string) => void;
  onDeleteConnectionLog: (logId: string) => void;
  onClearUnsavedConnectionLogs: () => void;
  onRunSnippet: (snippetId: string, sessionId: string) => void;
  onOpenLogView: (log: ConnectionLog) => void;
  navigateToSection: VaultSection | null;
  onNavigateToSectionHandled: () => void;
}

// Sidebar navigation item component
const SidebarNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const VaultView = memo(function VaultView({
  hosts,
  keys,
  identities,
  snippets,
  snippetPackages,
  customGroups,
  onOpenSettings,
  onDeleteHost,
  onConnect,
  onUpdateHosts,
  onUpdateSnippets,
  onUpdateSnippetPackages,
  navigateToSection,
  onNavigateToSectionHandled,
}: VaultViewProps) {
  const { t } = useI18n();
  const [section, setSection] = useState<VaultSection>("hosts");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [isNewHost, setIsNewHost] = useState(false);

  // Handle navigation from external sources
  React.useEffect(() => {
    if (navigateToSection) {
      setSection(navigateToSection);
      onNavigateToSectionHandled();
    }
  }, [navigateToSection, onNavigateToSectionHandled]);

  const filteredHosts = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return hosts;
    return hosts.filter(
      (h) =>
        h.label.toLowerCase().includes(query) ||
        h.hostname.toLowerCase().includes(query) ||
        (h.group || "").toLowerCase().includes(query)
    );
  }, [hosts, searchQuery]);

  // Group hosts by their group property
  const groupedHosts = React.useMemo(() => {
    const groups: Record<string, Host[]> = {};
    const ungrouped: Host[] = [];
    
    filteredHosts.forEach((host) => {
      if (host.group) {
        if (!groups[host.group]) {
          groups[host.group] = [];
        }
        groups[host.group].push(host);
      } else {
        ungrouped.push(host);
      }
    });
    
    return { groups, ungrouped };
  }, [filteredHosts]);

  // Get unique groups from customGroups and hosts
  const allGroups = React.useMemo(() => {
    const groupSet = new Set(customGroups);
    hosts.forEach((h) => {
      if (h.group) groupSet.add(h.group);
    });
    return Array.from(groupSet).sort();
  }, [customGroups, hosts]);

  const handleSaveHost = useCallback(
    (host: Host) => {
      const sanitized = sanitizeHost(host);
      if (isNewHost) {
        onUpdateHosts([...hosts, sanitized]);
        toast.success(t("toast.hostCreated"), "Host");
      } else {
        onUpdateHosts(
          hosts.map((h) => (h.id === sanitized.id ? sanitized : h))
        );
        toast.success(t("toast.hostSaved"), "Host");
      }
      setEditingHost(null);
      setIsNewHost(false);
    },
    [hosts, isNewHost, onUpdateHosts, t]
  );

  const handleNewHost = useCallback(() => {
    setEditingHost({
      id: crypto.randomUUID(),
      label: "",
      hostname: "",
      port: 445,
      share: "",
      username: "",
      group: "",
      tags: [],
      createdAt: Date.now(),
    });
    setIsNewHost(true);
  }, []);

  const handleEditHost = useCallback((host: Host) => {
    setEditingHost(host);
    setIsNewHost(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingHost(null);
    setIsNewHost(false);
  }, []);

  if (editingHost) {
    return (
      <div className="h-full bg-background">
        <HostDetailsPanel
          host={editingHost}
          isNewHost={isNewHost}
          keys={keys}
          identities={identities}
          onSave={handleSaveHost}
          onCancel={handleCancelEdit}
          onDelete={onDeleteHost}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar */}
      <div className="w-52 border-r border-border/60 flex flex-col">
        {/* Sidebar Header - Logo */}
        <div className="p-4 flex items-center gap-3">
          <AppLogo size={32} />
          <span className="text-lg font-semibold">SmbCatty</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <SidebarNavItem
            icon={<FolderOpen size={18} />}
            label={t("vault.hosts") || "Hosts"}
            active={section === "hosts"}
            onClick={() => setSection("hosts")}
          />
          <SidebarNavItem
            icon={<Zap size={18} />}
            label={t("vault.snippets") || "Snippets"}
            active={section === "snippets"}
            onClick={() => setSection("snippets")}
          />
        </nav>

        {/* Settings at bottom */}
        <div className="p-3 border-t border-border/60">
          <SidebarNavItem
            icon={<Settings size={18} />}
            label={t("common.settings") || "Settings"}
            onClick={onOpenSettings}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {section === "hosts" && (
          <>
            {/* Search Bar Header */}
            <div className="p-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("vault.searchPlaceholder") || "Find a host..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted/50"
                  />
                </div>
                <Button onClick={handleNewHost} className="gap-2">
                  <Plus size={16} />
                  {t("vault.newHost") || "New Host"}
                </Button>
              </div>
            </div>

            {/* Host Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Groups Section */}
              {allGroups.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-primary">
                      {t("vault.groups") || "Groups"}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {allGroups.length} {t("vault.total") || "total"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allGroups.map((group) => {
                      const count = groupedHosts.groups[group]?.length || 0;
                      return (
                        <div
                          key={group}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSearchQuery(group)}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen size={20} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{group}</div>
                            <div className="text-xs text-muted-foreground">
                              {count} {count === 1 ? "Host" : "Hosts"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hosts Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-primary">
                    {t("vault.hosts") || "Hosts"}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {filteredHosts.length} {t("vault.entries") || "entries"}
                  </span>
                </div>

                {filteredHosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? t("vault.noHostsMatch") || "No hosts match your search"
                        : t("vault.noHostsConfigured") || "No SMB hosts configured. Click 'New Host' to get started."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredHosts.map((host) => (
                      <div
                        key={host.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => handleEditHost(host)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground text-sm font-bold">
                          {host.label.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{host.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            \\{host.hostname}\{host.share || "..."}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConnect(host);
                          }}
                        >
                          {t("vault.connect") || "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {section === "snippets" && (
          <div className="flex-1 overflow-auto p-4">
            <SnippetsManager
              snippets={snippets}
              packages={snippetPackages}
              sessions={[]}
              onUpdateSnippets={onUpdateSnippets}
              onUpdatePackages={onUpdateSnippetPackages}
              onRunSnippet={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default VaultView;
