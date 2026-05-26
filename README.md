# Backlog Dashboard

A Next.js 16 multi-project backlog browser that reads backlog items from external repositories and serves them via a clean, filterable web interface. Supports dynamic project switching with custom icons and flexible backlog directory structures.

## Features

- **Multi-Project Support** - View backlogs from multiple repositories in a single dashboard
- **Project Switching** - Click the banner icon to open a modal and switch between projects
- **Custom Project Icons** - Display PNG icons for each project in the UI
- **Flexible Backlog Paths** - Support different backlog directory structures per project
- **Auto-Indexing** - File watcher automatically detects and caches backlog items on changes
- **Search & Filter** - Find items by ID, title, status, priority, tags, and feature
- **Obsidian Integration** - Deep links to open backlog files in Obsidian
- **ID Extraction** - Automatically extract IDs from titles (e.g., `INSP-01: Title`)

## Architecture

A static viewer with no backend database. Data is cached locally and indexed from external repository directories configured in `backlogs.yaml`.

### Key Components

| Component | Purpose |
|-----------|---------|
| `app/backlog/page.tsx` | Client-side backlog browser with search, filters, sorting |
| `app/api/backlog/route.ts` | API endpoint returning cached backlog items and configs |
| `lib/backlog-watcher.ts` | File watcher that indexes markdown files and caches them |
| `components/backlog/FilterBar.tsx` | Search bar with status, priority, tag dropdowns |
| `components/backlog/ProjectSelector.tsx` | Modal for switching between projects |
| `components/backlog/BacklogTable.tsx` | Sortable table of backlog items |

### Data Flow

```
backlogs.yaml (config)
    ↓
backlog-watcher (index & cache)
    ↓
~/.cache/backlog/backlog-dashboard/cache.json
    ↓
/api/backlog (filtered by ?project=name)
    ↓
UI (search, filter, sort, display)
```

## Configuration

### `~/.config/backlog/backlog-dashboard/backlogs.yaml`

Define your backlog projects in this YAML file. The dashboard will watch these directories and index their backlog items.

#### Basic Structure

```yaml
backlogs:
  - name: "Project Name"
    path: "/path/to/repo"
    icon: "/path/to/icon.png"                    # Optional: PNG icon path in public/
    backlogDir: "docs/backlog"                   # Optional: custom backlog dir (defaults to docs/backlog)
```

#### Example Configuration

```yaml
backlogs:
  - name: "Glimmer"
    path: "/home/user/Documents/src/glimmer-project"
    icon: "/stars@8x.png"
    
  - name: "Lunar"
    path: "/home/user/Documents/src/lua/lunar"
    icon: "/stars@8x.png"
    backlogDir: "docs/features"
    vaultId: "lunar-plugin"
```

#### Configuration Fields

- **`name`** (required): Display name of the project in the UI
- **`path`** (required): Absolute path to the repository root
- **`icon`** (optional): Path to a PNG icon file in the `public/` directory. Displayed in the banner and project selector
- **`backlogDir`** (optional): Custom path to backlog directory relative to repo root. Defaults to `docs/backlog` if not specified
- **`vaultId`** (optional): Obsidian vault ID for deep-linking. If specified, used instead of project name in Obsidian URLs. Otherwise falls back to project name

#### Icon Setup

1. Place your PNG icon file in the `public/` directory (e.g., `public/lunar-icon.png`)
2. Reference it in `backlogs.yaml` with the public path (e.g., `/lunar-icon.png`)
3. Icon will appear (24x24px) in the banner and project selector modal

## Backlog Format

Backlog items are Markdown files with YAML front matter located in the configured backlog directory.

### Front Matter Schema

```markdown
---
id: "PROJ-001"                          # Required or extractable from title
title: "Feature title"                  # Required: item title
type: "epic|feature|user-story|task"   # Optional: semantic type for hierarchy
parent_id: "PROJ"                       # Optional: parent item ID (for hierarchies)
status: "backlog|planned|in-progress|review|done|cancelled"
priority: "critical|high|medium|low"
estimate: 5                             # Optional: story points
tags: [tag1, tag2]                      # Optional: list of tags
feature: "features/path"                # Optional: feature category (Glimmer style)
created: "2026-05-20"                   # Optional: creation date
---
```

#### Field Reference

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| **`id`** | string | Yes* | Unique identifier (or extracted from title) |
| **`title`** | string | Yes | Item title |
| **`type`** | enum | No | `epic` / `feature` / `user-story` / `task` — for hierarchical organization |
| **`parent_id`** | string | No | Parent item ID (enables hierarchy: parent → children via filtering) |
| **`status`** | enum | Yes | Current state: backlog, planned, in-progress, review, done, cancelled |
| **`priority`** | enum | Yes | Priority level: critical, high, medium, low |
| **`estimate`** | number | No | Story points or time estimate |
| **`tags`** | array | No | List of tags for filtering and categorization |
| **`feature`** | string | No | Feature category (semantic grouping, e.g., "features/data-layer") — used by Glimmer backlog |
| **`created`** | string | No | ISO date string (YYYY-MM-DD) when the item was created |

*ID is required OR extractable from title pattern (e.g., `INSP-42: Title`)

### Hierarchy Examples

#### Lunar-style Hierarchical Structure

Items link explicitly via `parent_id`:

```yaml
---
id: "COMP"
title: "Completion"
type: "epic"
status: "in-progress"
---
```

```yaml
---
id: "COMP-03"
title: "Cross-file Completion"
type: "feature"
parent_id: "COMP"
status: "planned"
priority: "high"
estimate: 21
tags: [completion, cross-file]
---
```

```yaml
---
id: "COMP-03-01"
title: "Imported Symbol Suggestions"
type: "task"
parent_id: "COMP-03"
status: "planned"
priority: "high"
estimate: 8
---
```

The dashboard renders as:
```
COMP (Epic)
  └─ COMP-03 (Feature)
     ├─ COMP-03-01 (Task)
     ├─ COMP-03-02 (Task)
     └─ COMP-03-03 (Task)
```

#### Glimmer-style Semantic Grouping

Items use `feature` for categorization (no hierarchy):

```yaml
---
id: "G-001"
title: "Multi-database adapter support"
status: "backlog"
priority: "low"
estimate: 40
feature: "features/data-layer"
tags: [database, adapter]
---
```

### Full Front Matter Examples

#### Example 1: Lunar Task (hierarchical)

```markdown
---
id: "INSP-01-01"
title: "Resolve to Local"
type: "task"
parent_id: "INSP-01"
status: "in-progress"
priority: "high"
estimate: 13
tags: [analysis, scope-resolution]
---

### Description

Variables must resolve to a valid local declaration in an accessible scope.

### Acceptance Criteria

- [ ] Detect local variable declarations
- [ ] Handle scope nesting correctly
- [ ] Report unresolved locals with clear error messages

### Implementation Plan

1. Extend symbol resolver to track local scope
2. Add scope depth tracking
3. Implement resolution algorithm
```

#### Example 2: Glimmer Feature (semantic)

```markdown
---
id: "INSP-42"
title: "Implement variable type inference engine"
status: "in-progress"
priority: "high"
estimate: 21
feature: "features/type-inference"
tags: [analysis, type-system, performance]
created: "2026-05-15"
---

### Description

Implement a robust type inference engine that can analyze variable declarations and usage patterns to automatically determine and validate types.

### Acceptance Criteria

- [ ] Engine handles basic type inference (int, string, bool)
- [ ] Handles complex types (arrays, tables, functions)
- [ ] Performance: analyze 10k LOC in <500ms
- [ ] Test coverage: 85%+

### Implementation Notes

Build on the existing AST parser. Consider using a constraint-based approach for bidirectional type inference.
```

### ID Extraction

The dashboard supports three ways to define an ID:

1. **Explicit `id` field** (preferred):
   ```markdown
   ---
   id: "PROJ-001"
   title: "Feature title"
   ---
   ```

2. **Extract from title** (if no `id` field):
   ```markdown
   ---
   title: "INSP-01: Undeclared Variable Detection"
   ---
   ```
   The ID `INSP-01` is automatically extracted from the title pattern.

3. **Fallback**: Files without an ID are skipped and won't appear in the dashboard.

### Description Extraction

The dashboard automatically extracts the first paragraph from the "Description" section:

```markdown
### Description

This is the description text that appears in the dashboard.
Multi-paragraph descriptions get truncated to the first paragraph.
```

## Usage

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
.
├── app/
│   ├── backlog/
│   │   └── page.tsx                 # Main backlog browser page
│   ├── api/
│   │   └── backlog/
│   │       └── route.ts             # API endpoint
│   ├── layout.tsx                   # Root layout (triggers indexing)
│   └── globals.css
├── components/backlog/
│   ├── FilterBar.tsx                # Search and filter controls
│   ├── FilterDropdown.tsx           # Dropdown for status, priority, tags
│   ├── BacklogTable.tsx             # Main table display
│   ├── ProjectSelector.tsx          # Project switching modal
│   ├── types.ts                     # TypeScript types
│   └── ...
├── lib/
│   └── backlog-watcher.ts           # File watcher and indexer
├── public/
│   ├── stars@8x.png                 # Default project icon
│   └── ...
└── package.json
```

## Caching

### Cache Location

- **Cache file**: `~/.cache/backlog/backlog-dashboard/cache.json`
- **Log file**: `~/.cache/backlog/backlog-dashboard/watcher.log`

### Cache Behavior

- Cache is built on server start (`refreshIndex()` in `app/layout.tsx`)
- File watcher detects changes to markdown files and automatically updates cache
- API returns cached data (no database queries)
- Clear cache by deleting the `cache.json` file

## API

### GET /api/backlog

Returns cached backlog items and project configurations.

#### Query Parameters

- **`project`** (optional): Filter items by project name
  - Example: `/api/backlog?project=Glimmer`
  - Omit to return all items

#### Response

```json
{
  "items": [
    {
      "id": "G-001",
      "title": "Multi-database adapter support",
      "status": "backlog",
      "priority": "low",
      "estimate": 40,
      "tags": [],
      "feature": "features/data-layer",
      "created": "2026-05-20",
      "description": "Expand data layer flexibility...",
      "path": "docs/backlog/global/G-001.md",
      "backlogName": "Glimmer"
    }
  ],
  "configs": [
    {
      "name": "Glimmer",
      "path": "/home/user/Documents/src/glimmer-project",
      "icon": "/stars@8x.png"
    },
    {
      "name": "Lunar",
      "path": "/home/user/Documents/src/lua/lunar",
      "icon": "/stars@8x.png",
      "backlogDir": "docs/features",
      "vaultId": "lunar-plugin"
    }
  ]
}
```

## UI Features

### Search

Type to search across ID, title, description, tags, and feature fields. Supports multi-word search (AND logic).

### Filters

- **Status**: Backlog, Planned, In-Progress, Review, Done, Cancelled
- **Priority**: Critical, High, Medium, Low
- **Tags**: Dynamically populated from backlog items

### Sort

Click column headers to sort. Current sort column shows indicator (↑/↓).

### Project Switching

Click the banner icon (top-left) to open the project selector modal. Shows project name, icon, and path. Click a project to switch.

### Obsidian Integration

Item IDs are clickable links that open files in Obsidian. The vault name is determined by:

1. **`vaultId`** if specified in `backlogs.yaml` (e.g., `vaultId: "lunar-plugin"`)
2. **Project name** if `vaultId` is not specified

Example URL:
```
obsidian://open?vault=ProjectName&file=path/to/file
obsidian://open?vault=lunar-plugin&file=docs/features/inspections/01-undeclared-variable/requirements
```

## Development

### Technologies

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Node.js fs** - File watching and indexing

### File Watcher

The `backlog-watcher` module watches configured backlog directories using Node's `fs.watch()` API. When markdown files change, the cache is automatically refreshed.

### Testing

```bash
npm test
```

Runs unit tests in `lib/backlog-watcher.test.ts` (currently minimal).

## Troubleshooting

### No items appear

1. Verify `backlogs.yaml` exists and has correct paths
2. Check that backlog directories exist (or use custom `backlogDir`)
3. Verify markdown files have `id` field or extractable ID from title
4. Check logs: `~/.cache/backlog/backlog-dashboard/watcher.log`

### Config not updating

1. Restart dev server (`npm run dev`)
2. Clear cache: `rm ~/.cache/backlog/backlog-dashboard/cache.json`
3. Check file permissions on backlog directories

### Icon not displaying

1. Verify PNG file exists in `public/` directory
2. Check icon path in `backlogs.yaml` matches public path
3. Use absolute paths in config: `/icon-name.png`

### Items not found in Lunar (or custom backlog)

1. Verify the `backlogDir` in `backlogs.yaml` matches the actual directory structure
2. Ensure markdown files have an `id` field OR a title containing an ID pattern (e.g., `INSP-01: Title`)
3. Check watcher logs to see if the directory was indexed

## Future Enhancements

- [ ] Database backend for persistent state
- [ ] User-specific filters and saved searches
- [ ] Backlog item editing and creation via UI
- [ ] Integration with GitHub Issues, Jira
- [ ] Custom field definitions per project
- [ ] Bulk operations (move, tag, prioritize)

## License

(Add license info here)
