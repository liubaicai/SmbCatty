import React from 'react';
import { useI18n } from '../application/i18n/I18nProvider';
import { Snippet,TerminalSession } from '../types';

interface SnippetsManagerProps {
  snippets: Snippet[];
  packages: string[];
  sessions: TerminalSession[];
  onUpdateSnippets: (snippets: Snippet[]) => void;
  onUpdatePackages: (packages: string[]) => void;
  onRunSnippet: (snippetId: string, sessionId: string) => void;
}

const SnippetsManager: React.FC<SnippetsManagerProps> = ({
  snippets,
  onUpdateSnippets,
}) => {
  const { t } = useI18n();
  const [editingSnippet, setEditingSnippet] = React.useState<Snippet | null>(null);
  const [label, setLabel] = React.useState('');
  const [command, setCommand] = React.useState('');

  const handleSave = () => {
    if (!label.trim() || !command.trim()) return;
    
    const snippet: Snippet = {
      id: editingSnippet?.id || crypto.randomUUID(),
      label: label.trim(),
      command: command.trim(),
      tags: editingSnippet?.tags || [],
    };

    if (editingSnippet) {
      onUpdateSnippets(snippets.map(s => s.id === snippet.id ? snippet : s));
    } else {
      onUpdateSnippets([...snippets, snippet]);
    }
    
    setEditingSnippet(null);
    setLabel('');
    setCommand('');
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setLabel(snippet.label);
    setCommand(snippet.command);
  };

  const handleDelete = (snippetId: string) => {
    if (window.confirm('Delete this snippet?')) {
      onUpdateSnippets(snippets.filter(s => s.id !== snippetId));
    }
  };

  const handleCancel = () => {
    setEditingSnippet(null);
    setLabel('');
    setCommand('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">{t('snippets.title')}</h2>
        <button
          onClick={() => setEditingSnippet({ id: '', label: '', command: '' })}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
        >
          New Snippet
        </button>
      </div>

      {editingSnippet !== null && (
        <div className="border rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Snippet name"
              className="w-full px-3 py-2 border rounded bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Command</label>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Command or script"
              rows={4}
              className="w-full px-3 py-2 border rounded bg-background font-mono text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="px-3 py-1.5 border rounded text-sm">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!label.trim() || !command.trim()}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {snippets.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No snippets yet. Create one to save frequently used commands.
          </p>
        ) : (
          snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{snippet.label}</div>
                <div className="text-sm text-muted-foreground font-mono truncate">
                  {snippet.command}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(snippet)}
                  className="px-2 py-1 text-xs hover:bg-muted rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(snippet.id)}
                  className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SnippetsManager;
