import React from 'react';
import { Host,Identity,SSHKey } from '../types';

interface HostDetailsPanelProps {
  host: Host | null;
  isNewHost?: boolean;
  keys: SSHKey[];
  identities: Identity[];
  onSave: (host: Host) => void;
  onCancel: () => void;
  onDelete?: (hostId: string) => void;
}

// Simplified Host Details Panel for SMB Client
const HostDetailsPanel: React.FC<HostDetailsPanelProps> = ({
  host,
  isNewHost,
  onSave,
  onCancel,
}) => {
  const [label, setLabel] = React.useState(host?.label || '');
  const [hostname, setHostname] = React.useState(host?.hostname || '');
  const [port, setPort] = React.useState(host?.port || 445);
  const [share, setShare] = React.useState(host?.share || '');
  const [username, setUsername] = React.useState(host?.username || '');
  const [password, setPassword] = React.useState(host?.password || '');
  const [domain, setDomain] = React.useState(host?.domain || '');
  const [group, setGroup] = React.useState(host?.group || '');

  const handleSave = () => {
    onSave({
      id: host?.id || crypto.randomUUID(),
      label: label || hostname,
      hostname,
      port,
      share,
      username,
      password,
      domain,
      group,
      tags: host?.tags || [],
      createdAt: host?.createdAt || Date.now(),
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-medium">
        {isNewHost ? 'New SMB Host' : 'Edit SMB Host'}
      </h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Display name"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Hostname</label>
          <input
            type="text"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="server.local or IP address"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 445)}
              className="w-full px-3 py-2 border rounded bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Share</label>
            <input
              type="text"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              placeholder="shared"
              className="w-full px-3 py-2 border rounded bg-background text-foreground"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Domain (optional)</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="DOMAIN"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Group (optional)</label>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Office/Servers"
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hostname}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default HostDetailsPanel;
