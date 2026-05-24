<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Glimmer Backlog Dashboard

## Architecture

A Next.js 16 dashboard that reads backlog items from external repositories (configured in `backlogs.yaml`) and serves them via `/api/backlog`. The app is a static viewer—no backend database.

## Key Files

| File | Purpose |
|---|---|
| `~/.config/backlog/backlog-dashboard/backlogs.yaml` | Lists external backlog repositories (e.g., `glimmer-project`) |
| `lib/backlog-watcher.ts` | Watches backlog directories, parses YAML front matter, caches items |
| `app/api/backlog/route.ts` | API endpoint that calls `refreshIndex()` on each request |
| `app/backlog/page.tsx` | Client-side browser with search, filters, sort, Obsidian deep-links |
| `app/layout.tsx` | Root layout that triggers `startWatching()` on server render |
| `lib/backlog-watcher.test.ts` | Unit tests for backlog-watcher module |

## Data Loading

- `refreshIndex()` is called on each API request to ensure data is fresh
- `getIndex()` and `getBacklogConfigs()` return cached data (used by tests)
- `startWatching()` sets up file watchers for auto-refresh on changes
- **Cache Location**: `~/.cache/backlog/backlog-dashboard/cache.json`
- **Log Location**: `~/.cache/backlog/backlog-dashboard/watcher.log`
- **Config Location**: `~/.config/backlog/backlog-dashboard/backlogs.yaml`

## Dynamic Backlog Name

The dashboard title uses the `name` field from the first config in `backlogs.yaml`. To switch to a different backlog, update `backlogs.yaml` and restart the dev server.

**Note**: The API calls `refreshIndex()` on every request to ensure data freshness. The dev server logs show detailed info about config loading and item indexing.

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
```

## Workflow Notes

- **Data source**: External repos listed in `backlogs.yaml`—each repo’s `docs/backlog/` directory contains Markdown files with YAML front matter
- **Watch mode**: On server start, `backlog-watcher.ts` watches all configured backlog directories; changes trigger auto-refresh
- **Obsidian links**: Issue IDs link to `obsidian://open?vault=glimmer-project&file=...` deep links
- **Tests**: Unit tests in `lib/backlog-watcher.test.ts` verify config loading, item indexing, and caching

## Backlog Format

Each backlog item is a Markdown file with this front matter:

```yaml
---
id: "GDT-001"              # Repository-prefixed ID
title: "Feature title"
status: "backlog|planned|in-progress|review|done|cancelled"
priority: "critical|high|medium|low"
estimate?: 5               # Optional story points
tags: [tag1, tag2]         # Optional list
feature?: "features/..."   # Optional feature link
created: "2026-05-20"
---
```

See `.github/skills/backlog-manager/SKILL.md` for full format spec.
