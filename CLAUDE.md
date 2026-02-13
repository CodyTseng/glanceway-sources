# CLAUDE.md

## Project Overview

Community repository for creating and distributing information sources for [Glanceway](https://glanceway.app), a macOS menu bar app that displays information items. Sources periodically fetch data from APIs/feeds and emit items for display.

## Commands

```bash
npm install                                          # Install dependencies
npm run build-sources                                # Build all sources into dist/
npm run build-sources -- --source author/name        # Build a single source (also verifies compilation)
npm run generate-sources-json                        # Regenerate sources.json metadata
npm run generate-readme                              # Regenerate README.md
```

Scaffold a new TypeScript source (non-interactive):

```bash
npm run create-source -- \
  --name my-source \
  --author username \
  --display-name "My Source" \
  --description "A description" \
  --category Developer \
  --author-url "https://github.com/username" \
  --tags "tag1,tag2"
```

Required args: `--name`, `--author`, `--display-name`, `--description`, `--category`.
Optional args: `--author-url`, `--tags` (comma-separated).
If any required arg is missing, the script falls back to interactive prompts.

There is no test framework. Build the source to verify it compiles. There is no linter or formatter configured.

## Choosing Between YAML and TypeScript Sources

**Use a YAML source** when:

- Data comes from a single JSON API endpoint
- You only need simple field mapping (JSONPath) from the response to InfoItem fields
- No complex data transformation, pagination, or conditional logic is required

**Use a TypeScript source** when:

- You need multiple API calls or conditional logic
- You need complex data transformation (e.g., URL rewriting, combining fields)
- You need WebSocket connections
- You need pagination or OAuth
- You need persistent storage between refreshes

When in doubt, start with YAML. If the requirements exceed what YAML can express, switch to TypeScript.

## Creating a YAML Source

YAML sources are single `.yaml` files at `sources/<author>/<source-name>.yaml`. No scaffolding command needed - create the file directly.

### YAML Source Template

```yaml
version: 1.0.0
name: Display Name
description: Brief description
author: authorname
author_url: https://github.com/authorname
category: Developer
tags:
  - tag1
  - tag2

# Optional: user-configurable fields
# config:
#   - key: API_TOKEN
#     name: API Token
#     type: secret             # string, number, boolean, secret, select, or list
#     required: true
#     description: Your API token

source:
  url: https://api.example.com/data
  method: GET # GET, POST, PUT, DELETE (default: GET)
  # headers:
  #   Authorization: Bearer ${API_TOKEN}
  # body: |                                # For POST/PUT
  #   {"query": "search term"}

parse:
  root: $.data # Dot-notation path to the array of items
  mapping:
    id: $.id # Required: unique identifier
    title: $.title # Required: main display text
    # subtitle: $.description              # Optional: secondary text
    # url: $.link                          # Optional: click URL
    # timestamp: $.created_at              # Optional: ISO 8601, Unix seconds, or Unix ms
  # baseUrl: https://example.com           # Optional: base URL for relative paths
  # filter:                                # Optional: filter items
  #   - field: $.type
  #     equals: "article"
  #   - field: $.status
  #     notEquals: "draft"
```

Config values are referenced in source as `${KEY}`. Path syntax: `$` = root (for top-level arrays), `$.prop` = child property, `$.prop.nested` = nested property. No array operators (`[*]`, `[0:5]`) are supported.

### Verify

```bash
npm run build-sources -- --source author/source-name
```

YAML sources are copied as-is (no compilation). Check `dist/author/source-name/` for the output.

## Creating a TypeScript Source

### Step 1: Scaffold

```bash
npm run create-source -- \
  --name my-source \
  --author myname \
  --display-name "My Source" \
  --description "Fetches items from Example API" \
  --category Developer
```

This creates `sources/myname/my-source/` with `manifest.yaml` and `index.ts`.

### Step 2: Implement index.ts

Edit `index.ts` to implement source logic. See the API Reference below and use `sources/codytseng/github-notifications/` as a canonical example.

### Step 3: Update manifest.yaml Config

Add `config` entries for any values the user needs to provide (API tokens, usernames, etc.):

```yaml
config:
  - key: API_TOKEN
    name: API Token
    type: secret # string, number, boolean, secret, select, or list
    required: true
    description: Your API token
  - key: USERNAME
    name: Username
    type: string
    required: false
    description: Optional username filter
  - key: SORT
    name: Sort Order
    type: select
    required: false
    default: hot
    description: Sort order for results
    options:
      - hot
      - new
      - top
```

### Step 4: Build and Verify

```bash
npm run build-sources -- --source myname/my-source
```

## Source Development Constraints

**NO external imports.** Sources cannot use `import` or `require` for external packages. The only allowed import is the type import:

```typescript
import type { GlancewayAPI, SourceMethods } from "../../types";
```

All functionality is provided through the `api` parameter. Use `export default` for the default export. Use `GlancewayAPI<Config>` generic when config fields are defined:

```typescript
export default (api: GlancewayAPI<Config>): SourceMethods => {
  async function fetchData() {
    /* fetch, transform, emit */
  }

  // Start phase: initial fetch
  fetchData();

  return {
    refresh: fetchData,
    stop() {
      /* optional cleanup */
    },
  };
};
```

## API Reference

All methods are available on the `api: GlancewayAPI` parameter.

### api.emit(items: InfoItem[])

Send items to Glanceway for display.

```typescript
interface InfoItem {
  id: string; // Unique identifier
  title: string; // Main display text
  subtitle?: string; // Secondary text below title
  url?: string; // Link opened on click
  timestamp?: Date | string | number; // ISO string, Unix timestamp, or Date
}
```

### api.fetch\<T\>(url: string, options?: FetchOptions): Promise\<FetchResponse\<T\>\>

Make HTTP requests. Supports generics for typed JSON responses.

```typescript
interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // default: GET
  headers?: Record<string, string>;
  body?: string;
  timeout?: number; // milliseconds, default: 30000
}

interface FetchResponse<T> {
  ok: boolean; // true if status 200-299
  status: number;
  headers: Record<string, string>;
  text: string; // raw response body
  json?: T; // parsed JSON (if valid)
}
```

Example:

```typescript
const response = await api.fetch<{
  items: Array<{ id: string; name: string }>;
}>("https://api.example.com/data", {
  headers: { Authorization: `Bearer ${token}` },
});
if (response.ok && response.json) {
  // response.json is typed
}
```

### api.config.get(key: string): unknown

Get a user-configured value by key (defined in `manifest.yaml` config section). Returns `string` for most types, `string[]` for `list` type.

### api.config.getAll(): Record\<string, unknown\>

Get all user-configured values as a key-value map.

### api.storage.get(key: string): string | undefined

Get a persisted value. Data survives between refreshes and app restarts.

### api.storage.set(key: string, value: string): void

Store a value persistently.

### api.log(level, message)

Log messages for debugging. Levels: `"info"`, `"error"`, `"warn"`, `"debug"`.

### api.appVersion

Current Glanceway app version string (e.g., `"1.2.0"`).

### api.websocket.connect(url, callbacks): Promise\<WebSocketConnection\>

Create a WebSocket connection for real-time data.

```typescript
interface WebSocketCallbacks {
  onConnect?: (ws: WebSocketConnection) => void;
  onMessage?: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: (code: number) => void;
}

interface WebSocketConnection {
  send(message: string): Promise<void>;
  close(): void;
}
```

## manifest.yaml Full Schema

```yaml
version: 1.0.0 # Required: semantic version
name: Display Name # Required: shown in Glanceway
description: Brief description # Required
author: authorname # Required
author_url: https://... # Optional
category: Developer # Required: Developer | News | Social | Finance | Entertainment | Productivity | Other
tags: # Optional
  - tag1
min_app_version: 1.2.0 # Optional: minimum Glanceway app version required
config: # Optional: user-configurable values
  - key: API_TOKEN
    name: API Token
    type: secret # string, number, boolean, secret, select, or list
    required: true
    description: Description shown to user
  - key: TAGS
    name: Tags
    type: list # list for string arrays (multiple values)
    required: false
    description: Tags to filter by
  - key: SORT
    name: Sort Order
    type: select # select requires options list
    required: false
    default: hot
    options:
      - hot
      - new
      - top
```

## Source Lifecycle

TypeScript sources have two distinct phases:

1. **Start phase**: When the source is first loaded, the default export function (outer closure) runs. The app does **NOT** call `refresh()` at this point. Sources should perform their initial data fetch here by calling their fetch function directly (fire-and-forget, without `await`).
2. **Refresh phase**: On each scheduled refresh interval, the app calls `refresh()`. This is the only time `refresh()` is invoked.

This separation allows sources to distinguish between initial load and periodic refresh, enabling different behavior if needed (e.g., full load on start vs. incremental update on refresh). For most sources, both phases do the same work.

### Standard Pattern

Extract the fetch logic into a named async function, call it in the outer closure for the start phase, and assign it as the `refresh` method:

```typescript
export default (api: GlancewayAPI<Config>): SourceMethods => {
  const token = api.config.get("API_TOKEN");

  async function fetchData() {
    const res = await api.fetch<Item[]>(url);
    if (!res.ok || !res.json) {
      throw new Error(`Failed to fetch (HTTP ${res.status})`);
    }
    api.emit(toItems(res.json));
  }

  // Start phase: initial fetch
  fetchData();

  return {
    refresh: fetchData,
  };
};
```

## Source Design Guidelines

- Always make full use of the `subtitle` field. If the API response contains summary, description, brief, or any descriptive text, map it to `subtitle` so users get maximum information at a glance.
- **Maximize items per fetch.** The app does not paginate, so each fetch should retrieve as many items as the API allows without hurting performance. The hard upper limit is **500 items** — never exceed this. For APIs with a configurable page size, set it to the API's maximum or 500, whichever is smaller. For sources that make N parallel sub-requests (e.g., Hacker News, xkcd), keep N reasonable to avoid excessive latency.

## TypeScript Source Code Conventions

### File Structure Order

```typescript
// 1. Type import (always first)
import type { GlancewayAPI, SourceMethods } from "../../types";

// 2. Type definitions (config, response types, data models)
type Config = {
  API_TOKEN: string;
  TAGS: string[];
};

type Article = {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
};

// 3. Helper functions (pure utilities, no api dependency)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

// 4. Default export (with Config generic)
export default (api: GlancewayAPI<Config>): SourceMethods => {
  // 5. Config reading (in outer closure; script reloads on config change)
  const token = api.config.get("API_TOKEN");

  // 6. Fetch function (fetch, transform, emit)
  async function fetchData() {
    // ...
  }

  // 7. Start phase: initial fetch
  fetchData();

  return {
    refresh: fetchData,
  };
};
```

### Config Typing

Use `GlancewayAPI<Config>` generic to define config field types. This gives `api.config.get()` type-safe keys and return values, eliminating manual `as` casts.

```typescript
type Config = {
  SORT: string;
  TAGS: string[];
};

export default (api: GlancewayAPI<Config>): SourceMethods => {
  const sort = api.config.get("SORT");   // string
  const tags = api.config.get("TAGS");   // string[]
  // api.config.get("TYPO")              // compile error

  async function fetchData() {
    // use sort, tags directly
  }

  fetchData();

  return {
    refresh: fetchData,
  };
};
```

### Config Reading

Read config **in the outer closure** (before `return`), not inside the fetch function. When config changes, Glanceway reloads the entire script, so the outer closure always has fresh values.

```typescript
export default (api: GlancewayAPI<Config>): SourceMethods => {
  const sort = api.config.get("SORT") || "hot";

  async function fetchData() {
    // use sort directly
  }

  fetchData();

  return {
    refresh: fetchData,
  };
};
```

### Response Type Annotations

Use `api.fetch<T>()` generics to type responses. For simple/one-off types, inline them at the call site. For complex or reused types, define named types at the top of the file.

```typescript
// Simple: inline
const res = await api.fetch<{ items: Article[] }>("https://...");

// Complex: use named interface defined at file top
const res = await api.fetch<RedditListing>("https://...");
```

### Error Handling

Check `res.ok && res.json` before using response data. For the main/only request, throw on failure. For parallel sub-requests, skip failures silently.

```typescript
// Single request: throw on failure
const res = await api.fetch<Article[]>(url);
if (!res.ok || !res.json) {
  throw new Error(`Failed to fetch articles (HTTP ${res.status})`);
}
api.emit(toItems(res.json));
```

### Parallel Requests

Always use `Promise.allSettled` (never `Promise.all`) for parallel requests. Skip failed results instead of throwing.

```typescript
await Promise.allSettled(
  ids.map(async (id) => {
    const res = await api.fetch<Item>(`https://api.example.com/items/${id}`);
    if (res.ok && res.json) {
      items.push(res.json);
      api.emit(/* ... */);
    }
  }),
);
```

### Helper Functions

Define reusable mapping functions (e.g., `toItems`) **inside the fetch function** when they use closure variables. Define pure utility functions (e.g., `stripHtml`) **at the module top** before the export.

```typescript
// Module top: pure utility, no dependency on api or config
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export default (api: GlancewayAPI): SourceMethods => {
  async function fetchData() {
    // Inside fetch function: uses closure variables
    const toItems = (articles: Article[]) =>
      articles.map((a) => ({
        id: a.id.toString(),
        title: a.title,
        subtitle: stripHtml(a.description),
        url: a.url,
        timestamp: a.published_at,
      }));
  }

  fetchData();

  return {
    refresh: fetchData,
  };
};
```

## Auto-Generated Files (Do Not Commit)

The pre-commit hook blocks commits containing `dist/`, `README.md`, or `sources.json`. These are generated by CI on push to master.
