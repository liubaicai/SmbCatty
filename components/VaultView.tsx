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

export const VaultView = memo(function VaultView({
  hosts,
  keys,
  identities,
  snippets,
  snippetPackages,
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <AppLogo size={32} />
          <h1 className="text-xl font-semibold">SmbCatty</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b px-4">
        <button
          onClick={() => setSection("hosts")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            section === "hosts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          SMB Hosts
        </button>
        <button
          onClick={() => setSection("snippets")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            section === "snippets"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="h-4 w-4 inline mr-1" />
          Snippets
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {section === "hosts" && (
          <div className="space-y-4">
            {/* Search and Add */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hosts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleNewHost}>
                <Plus className="h-4 w-4 mr-1" />
                Add Host
              </Button>
            </div>

            {/* Host List */}
            <div className="grid gap-2">
              {filteredHosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No hosts match your search"
                    : "No SMB hosts configured. Click 'Add Host' to get started."}
                </div>
              ) : (
                filteredHosts.map((host) => (
                  <div
                    key={host.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEditHost(host)}
                  >
                    <div>
                      <div className="font-medium">{host.label}</div>
                      <div className="text-sm text-muted-foreground">
                        \\{host.hostname}\{host.share || "..."}
                        {host.group && (
                          <span className="ml-2 text-xs">({host.group})</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConnect(host);
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {section === "snippets" && (
          <SnippetsManager
            snippets={snippets}
            packages={snippetPackages}
            sessions={[]}
            onUpdateSnippets={onUpdateSnippets}
            onUpdatePackages={onUpdateSnippetPackages}
            onRunSnippet={() => {}}
          />
        )}
      </div>
    </div>
  );
});

export default VaultView;
