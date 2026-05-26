import { watch, FSWatcher } from 'fs';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';
import * as fsExtra from 'fs-extra';

interface BacklogConfig {
  name: string;
  path: string;
  icon?: string;
  backlogDir?: string;
  vaultId?: string;
}

interface BacklogItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimate?: number | null;
  tags: string[];
  feature?: string;
  parent_id?: string;
  type?: string;
  created: string;
  description: string;
  path: string;
  backlogName: string;
}

const SKIP_FILES = ['README.md', 'format.md'];

// Determine cache directory based on environment details
const CACHE_ROOT = path.join(os.homedir(), '.cache', 'backlog', 'backlog-dashboard');
fsExtra.ensureDirSync(CACHE_ROOT);

const LOG_FILE = path.join(CACHE_ROOT, 'watcher.log');
const CACHE_FILE = path.join(CACHE_ROOT, 'cache.json');

const extractDescription = (body: string): string => {
  const descMatch = body.match(/###\s+Description\s*\n([\s\S]*?)(?=\n###|\Z)/);
  if (!descMatch) {
    return '';
  }
  const desc = descMatch[1].trim();
  const paragraphs = desc.split(/\n\n+/);
  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();
    if (!clean) {
      continue;
    }
    const cleaned = clean
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/^\s*[-\d.]+\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.substring(0, 300);
  }
  return '';
};

const log = (message: string) => {
  const timestamp = new Date().toISOString();
  const pid = process.pid;
  const logLine = `[${timestamp}] [PID:${pid}] ${message}\n`;
  fsExtra.appendFileSync(LOG_FILE, logLine);
  console.log(`[PID:${pid}] ${message}`);
};

interface Cache {
  items: BacklogItem[];
  configs: BacklogConfig[];
  lastLoaded?: number;
}

let inMemoryCache: Cache | null = null;
let cacheWatcher: FSWatcher | null = null;

const ensureCacheWatcher = () => {
  if (cacheWatcher || !fs.existsSync(CACHE_FILE)) return;

  try {
    log(`[backlog-watcher] Starting cache file watcher for ${CACHE_FILE}`);
    cacheWatcher = watch(CACHE_FILE, (eventType) => {
      if (eventType === 'change') {
        log(`[backlog-watcher] Cache file change detected, reloading in-memory cache`);
        try {
          const stats = fs.statSync(CACHE_FILE);
          const data = fs.readFileSync(CACHE_FILE, 'utf-8');
          const cache = JSON.parse(data);
          inMemoryCache = { ...cache, lastLoaded: stats.mtimeMs };
        } catch (e) {
          log(`[backlog-watcher] Error reloading cache file: ${e}`);
        }
      }
    });
  } catch (e) {
    log(`[backlog-watcher] Error starting cache file watcher: ${e}`);
  }
};

const getGlobalCache = (): Cache => {
  ensureCacheWatcher();
  
  if (inMemoryCache) {
    return inMemoryCache;
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      log(`[backlog-watcher] Cache not in memory, reading from ${CACHE_FILE}`);
      const stats = fs.statSync(CACHE_FILE);
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(data);
      inMemoryCache = { ...cache, lastLoaded: stats.mtimeMs };
      return inMemoryCache!;
    }
  } catch (e) {
    log(`[backlog-watcher] Cache read error: ${e}`);
  }
  return { items: [], configs: [] };
};

export const getIndex = (): BacklogItem[] => {
  const cache = getGlobalCache();
  return cache.items;
};

export const getBacklogConfigs = (): BacklogConfig[] => {
  const cache = getGlobalCache();
  return cache.configs;
};

export const refreshIndex = (): BacklogItem[] => {
  const configs = loadConfig();
  log(`[backlog-watcher] Loaded ${configs.length} backlog config(s)`);
  
  const items: BacklogItem[] = [];

  for (const config of configs) {
    log(`[backlog-watcher] Indexing backlog: ${config.name} at ${config.path}`);
    const backlogItems = indexBacklog(config.path, config.name, config.backlogDir);
    log(`[backlog-watcher] Found ${backlogItems.length} items in ${config.name}`);
    items.push(...backlogItems);
  }

  const cache = { items, configs };
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    const stats = fs.statSync(CACHE_FILE);
    inMemoryCache = { ...cache, lastLoaded: stats.mtimeMs };
    log(`[backlog-watcher] Cache written to ${CACHE_FILE} and updated in memory`);
    ensureCacheWatcher();
  } catch (e) {
    log(`[backlog-watcher] Cache write error: ${e}`);
  }
  
  log(`[backlog-watcher] Total items cached: ${items.length}`);
  return items;
};

const isArtifactDir = (filePath: string): boolean => {
  const parentDir = path.basename(path.dirname(filePath));
  return /^[A-Z]+-\d+$/.test(parentDir);
};

const parseFrontMatter = (text: string): { fields: Record<string, unknown>; body: string } => {
  if (!text.startsWith('---')) {
    return { fields: {}, body: text };
  }
  const end = text.indexOf('\n---', 3);
  if (end === -1) {
    return { fields: {}, body: text };
  }
  const fmText = text.substring(3, end).trim();
  const body = text.substring(end + 4).replace(/^\n+/, '');

  const fields: Record<string, unknown> = {};
  for (const line of fmText.split('\n')) {
    const match = line.match(/^([\w-]+):\s*(.*)/);
    if (!match) {
      continue;
    }
    const [, key, val] = match;
    const value = val.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      fields[key] = inner.split(',').map((v) => v.trim()).filter(Boolean);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      fields[key] = value.slice(1, -1);
    } else if (/^-?\d+$/.test(value)) {
      fields[key] = parseInt(value, 10);
    } else if (value !== '') {
      fields[key] = value;
    }
  }

  return { fields, body };
};

export const indexBacklog = (root: string, backlogName: string, backlogDir?: string): BacklogItem[] => {
  const dir = backlogDir || path.join('docs', 'backlog');
  const fullBacklogDir = path.join(root, dir);
  const items: BacklogItem[] = [];

  // Return empty items if backlog dir doesn't exist
  if (!fs.existsSync(fullBacklogDir)) {
    log(`[backlog-watcher] Backlog directory not found: ${fullBacklogDir}`);
    return items;
  }

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && entry.endsWith('.md')) {
        if (SKIP_FILES.includes(entry)) {
          continue;
        }
        if (isArtifactDir(fullPath)) {
          continue;
        }

        const text = fs.readFileSync(fullPath, 'utf-8');
        const { fields, body } = parseFrontMatter(text);

        // Try to get ID from fields, or extract from title, or use filename
        let id = String(fields.id || '');
        if (!id && fields.title) {
          // Try to extract ID from title like "INSP-01: Undeclared Variable"
          const idMatch = String(fields.title).match(/^([A-Z]+-\d+)/);
          id = idMatch ? idMatch[1] : '';
        }
        // If still no ID, skip this file
        if (!id) {
          continue;
        }

        const item: BacklogItem = {
          id,
          title: String(fields.title || ''),
          status: String(fields.status || ''),
          priority: String(fields.priority || ''),
          estimate: (fields.estimate as number) ?? null,
          tags: Array.isArray(fields.tags) ? (fields.tags as string[]) : [],
          feature: fields.feature ? String(fields.feature) : undefined,
          parent_id: fields.parent_id ? String(fields.parent_id) : undefined,
          type: fields.type ? String(fields.type) : undefined,
          created: String(fields.created || ''),
          description: extractDescription(body),
          path: path.relative(root, fullPath).replace(/\\/g, '/'),
          backlogName,
        };
        items.push(item);
      }
    }
  };

  walk(fullBacklogDir);
  return items.sort((a, b) => a.id.localeCompare(b.id));
};

export const loadConfig = (): BacklogConfig[] => {
  try {
    const configPath = path.join(os.homedir(), '.config', 'backlog', 'backlog-dashboard', 'backlogs.yaml');
    log(`[backlog-watcher] Loading config from: ${configPath}`);
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as { backlogs: BacklogConfig[] };
    log(`[backlog-watcher] Config loaded: ${JSON.stringify(config)}`);
    return config.backlogs || [];
  } catch (error) {
    log(`[backlog-watcher] Failed to load config: ${error}`);
    return [];
  }
};

export const startWatching = (): void => {
  const configs = loadConfig();

  for (const config of configs) {
    const backlogDir = path.join(config.path, 'docs', 'backlog');

    if (!fs.existsSync(backlogDir)) {
      log(`[backlog-watcher] Backlog directory not found: ${backlogDir}`);
      continue;
    }

    log(`[backlog-watcher] Watching backlog: ${config.name} at ${backlogDir}`);

    const watcher = watch(backlogDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md') && !SKIP_FILES.includes(filename)) {
        log(`[backlog-watcher] Change detected in ${filename}, refreshing index...`);
        refreshIndex();
      }
    });

    watcher.on('error', (error) => {
      log(`[backlog-watcher] Watcher error for ${config.name}: ${error}`);
    });
  }
};
