# Backlog Item Front-Matter Vocabulary

This document defines the schema for YAML front-matter fields used in backlog Markdown files. These fields are consumed by the Backlog Dashboard and enforced by the `backlog-manager` skill.

## Core Fields (Required)

| Field | Type | Description | Allowed Values / Format |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique item identifier with component prefix. | `<PREFIX>-<NNN>` (e.g., `GDT-001`) |
| `title` | String | Brief, imperative title for the item. | Plain text |
| `status` | String | Current lifecycle state. | `backlog`, `planned`, `in-progress`, `review`, `done`, `cancelled` |
| `priority` | String | Level of urgency or importance. | `critical`, `high`, `medium`, `low` |
| `created` | Date | The date the item was created. | `YYYY-MM-DD` |

## Metadata & Relationships (Optional)

| Field | Type | Description | Format / Example |
| :--- | :--- | :--- | :--- |
| `estimate` | Integer | Estimated effort in story points. | `5`, `8`, `13` |
| `tags` | List | Categorization labels for filtering. | `[automation, security]` |
| `feature` | String | Relative path to a feature document. | `docs/features/my-feature.md` |
| `type` | String | The semantic category of the item. | `epic`, `feature`, `user-story`, `spec`, `design`, `plan` |
| `repository` | String | The target repository for the work. | `glimmer-demo-tool` |
| `parent_id` | String | ID of the parent item (for hierarchy). | `G-001` |

## Template

You can copy and paste this block into the top of a new `.md` file:

```yaml
---
id: "PREFIX-001"
title: "Imperative title here"
status: "backlog"
priority: "medium"
type: "user-story"
estimate: 5
tags: []
feature: ""
repository: ""
parent_id: ""
created: 2026-05-29
---
```

## Content Requirements

The system also extracts the **Description** from the body of the Markdown file:
- It must be placed under a `### Description` header.
- The first paragraph (up to 300 characters) is used for summaries in the dashboard.
