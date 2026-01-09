import { Host } from "./models";

export type VaultImportFormat = "csv";

export type VaultImportIssueLevel = "warning" | "error";

export interface VaultImportIssue {
  level: VaultImportIssueLevel;
  message: string;
}

export interface VaultImportStats {
  parsed: number;
  imported: number;
  skipped: number;
  duplicates: number;
}

export interface VaultImportResult {
  hosts: Host[];
  groups: string[];
  issues: VaultImportIssue[];
  stats: VaultImportStats;
}

export interface VaultCsvTemplateOptions {
  includeExampleRows?: boolean;
}

const DEFAULT_SMB_PORT = 445;

const normalizeGroupPath = (raw: string | undefined): string | undefined => {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\\/g, "/");
  const parts = normalized.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join("/");
};

const parsePort = (raw: string | undefined): number | undefined => {
  const s = raw?.trim();
  if (!s) return undefined;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return undefined;
  return n;
};

const splitTags = (raw: string | undefined): string[] => {
  const s = raw?.trim();
  if (!s) return [];
  return s
    .split(/[,;，]/g)
    .map((t) => t.trim())
    .filter(Boolean);
};

const hostKey = (h: Pick<Host, "hostname" | "port" | "username" | "share">) =>
  `smb|${h.hostname.toLowerCase()}|${h.port}|${h.share || ''}|${(h.username ?? "").toLowerCase()}`;

const createHost = (input: {
  label?: string;
  hostname: string;
  port?: number;
  username?: string;
  password?: string;
  share?: string;
  domain?: string;
  group?: string;
  tags?: string[];
}): Host => ({
  id: crypto.randomUUID(),
  label: input.label || input.hostname,
  hostname: input.hostname,
  port: input.port || DEFAULT_SMB_PORT,
  share: input.share || "",
  username: input.username || "",
  password: input.password,
  domain: input.domain,
  group: input.group,
  tags: input.tags || [],
  createdAt: Date.now(),
});

/**
 * Import hosts from CSV text
 * Expected columns: label, hostname, port, share, username, password, domain, group, tags
 */
const parseCsvHosts = (
  text: string,
  existingHosts: Host[],
): VaultImportResult => {
  const issues: VaultImportIssue[] = [];
  const hosts: Host[] = [];
  const groups = new Set<string>();
  let parsed = 0;
  let duplicates = 0;
  let skipped = 0;

  const existingKeys = new Set(existingHosts.map((h) => hostKey(h)));
  const newKeys = new Set<string>();

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) {
    issues.push({ level: "error", message: "No data rows found in CSV" });
    return { hosts: [], groups: [], issues, stats: { parsed: 0, imported: 0, skipped: 0, duplicates: 0 } };
  }

  // Get header from first line
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  
  const colIdx = {
    label: headers.indexOf("label"),
    hostname: headers.indexOf("hostname"),
    port: headers.indexOf("port"),
    share: headers.indexOf("share"),
    username: headers.indexOf("username"),
    password: headers.indexOf("password"),
    domain: headers.indexOf("domain"),
    group: headers.indexOf("group"),
    tags: headers.indexOf("tags"),
  };

  if (colIdx.hostname < 0) {
    issues.push({ level: "error", message: "CSV must have a 'hostname' column" });
    return { hosts: [], groups: [], issues, stats: { parsed: 0, imported: 0, skipped: 0, duplicates: 0 } };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    parsed++;

    const cols = parseCSVLine(line);
    const hostname = cols[colIdx.hostname]?.trim();
    if (!hostname) {
      skipped++;
      issues.push({ level: "warning", message: `Row ${i + 1}: Missing hostname, skipped` });
      continue;
    }

    const host = createHost({
      label: colIdx.label >= 0 ? cols[colIdx.label]?.trim() : undefined,
      hostname,
      port: parsePort(colIdx.port >= 0 ? cols[colIdx.port] : undefined),
      share: colIdx.share >= 0 ? cols[colIdx.share]?.trim() : undefined,
      username: colIdx.username >= 0 ? cols[colIdx.username]?.trim() : undefined,
      password: colIdx.password >= 0 ? cols[colIdx.password]?.trim() : undefined,
      domain: colIdx.domain >= 0 ? cols[colIdx.domain]?.trim() : undefined,
      group: normalizeGroupPath(colIdx.group >= 0 ? cols[colIdx.group] : undefined),
      tags: splitTags(colIdx.tags >= 0 ? cols[colIdx.tags] : undefined),
    });

    const key = hostKey(host);
    if (existingKeys.has(key) || newKeys.has(key)) {
      duplicates++;
      continue;
    }
    newKeys.add(key);
    hosts.push(host);
    if (host.group) groups.add(host.group);
  }

  return {
    hosts,
    groups: Array.from(groups),
    issues,
    stats: { parsed, imported: hosts.length, skipped, duplicates },
  };
};

/**
 * Parse a single CSV line, handling quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

/**
 * Import hosts from text (auto-detect format)
 */
export const importVaultHostsFromText = (
  text: string,
  existingHosts: Host[],
  _format?: VaultImportFormat,
): VaultImportResult => {
  return parseCsvHosts(text, existingHosts);
};

/**
 * Generate CSV template for importing hosts
 */
export const generateCsvTemplate = (
  options: VaultCsvTemplateOptions = {},
): string => {
  const headers = ["label", "hostname", "port", "share", "username", "password", "domain", "group", "tags"];
  let csv = headers.join(",") + "\n";
  
  if (options.includeExampleRows) {
    csv += '"File Server","fileserver.local",445,"documents","admin","","DOMAIN","Office/Servers","files,office"\n';
    csv += '"NAS Drive","192.168.1.100",445,"backup","user","","","Home","nas,backup"\n';
  }
  
  return csv;
};

/**
 * Detect import format from text content
 */
export const detectImportFormat = (_text: string): VaultImportFormat | null => {
  return "csv";
};
