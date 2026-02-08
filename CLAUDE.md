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
#     type: secret             # string, number, boolean, secret, or select
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
    type: secret # string, number, boolean, secret, or select
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

All functionality is provided through the `api` parameter. Use `export default` for the default export:

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      /* ... */
    },
    stop() {
      /* optional cleanup */
    },
  };
};
```

## API Reference

All methods are available on the `api: GlancewayAPI` parameter.

### api.emit(items: InfoItem[])

Send items to Glanceway for display. Call this in `refresh()`.

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

### api.config.get(key: string): string | undefined

Get a user-configured value by key (defined in `manifest.yaml` config section).

### api.config.getAll(): Record\<string, string\>

Get all user-configured values as a key-value map.

### api.storage.get(key: string): unknown

Get a persisted value. Data survives between refreshes and app restarts.

### api.storage.set(key: string, value: unknown): void

Store a value persistently.

### api.log(level, message)

Log messages for debugging. Levels: `"info"`, `"error"`, `"warn"`, `"debug"`.

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
config: # Optional: user-configurable values
  - key: API_TOKEN
    name: API Token
    type: secret # string, number, boolean, secret, or select
    required: true
    description: Description shown to user
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

## Source Design Guidelines

- Always make full use of the `subtitle` field. If the API response contains summary, description, brief, or any descriptive text, map it to `subtitle` so users get maximum information at a glance.

## Auto-Generated Files (Do Not Commit)

The pre-commit hook blocks commits containing `dist/`, `README.md`, or `sources.json`. These are generated by CI on push to master.
