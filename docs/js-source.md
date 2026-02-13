# TypeScript Source Development

TypeScript sources provide full control over data fetching and processing.

## Quick Start

Create a new source using the CLI:

```bash
npm run create-source -- \
  --name my-source \
  --author myname \
  --display-name "My Source" \
  --description "Fetches items from Example API" \
  --category Developer
```

Or run `npm run create-source` for the interactive prompts.

## Source Structure

```
sources/your-username/my-source/
├── manifest.yaml    # Source metadata
└── index.ts         # Source logic
```

## manifest.yaml

```yaml
version: 1.0.0
name: My Source
description: A brief description of what this source provides
author: your-username
author_url: https://github.com/your-username
category: Developer
tags:
  - example
  - api

# Optional: User-configurable fields
config:
  - key: API_TOKEN
    name: API Token
    type: secret           # string, number, boolean, secret, select, or list
    description: Your API token
    required: true

  - key: USERNAME
    name: Username
    type: string
    description: Filter by username (optional)
    required: false

  - key: SORT
    name: Sort Order
    type: select           # use select with options for fixed value sets
    description: Sort order for results
    required: false
    default: hot
    options:
      - hot
      - new
      - top
```

## Source Lifecycle

TypeScript sources have two distinct phases:

1. **Start phase**: When the source is first loaded, the default export function runs. The app does **NOT** call `refresh()` at this point. Sources should `await` their initial data fetch before returning.
2. **Refresh phase**: On each scheduled refresh interval, the app calls `refresh()`. This is the only time `refresh()` is invoked.
3. **Stop**: `stop()` is called when the source is disabled or removed. Use for cleanup.

### Standard Pattern

Extract fetch logic into a named async function, `await` it in the outer closure, and assign it as the `refresh` method:

```typescript
import type { GlancewayAPI, SourceMethods } from "../../types";

type Config = {
  API_TOKEN: string;
};

export default async (api: GlancewayAPI<Config>): Promise<SourceMethods> => {
  const token = api.config.get("API_TOKEN");

  async function fetchData() {
    const response = await api.fetch<{ items: Item[] }>(
      "https://api.example.com/items",
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok || !response.json) {
      throw new Error(`Failed to fetch items (HTTP ${response.status})`);
    }

    api.emit(
      response.json.items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.description,
        url: item.url,
        timestamp: item.created_at,
      })),
    );
  }

  // Start phase: initial fetch
  await fetchData();

  return {
    refresh: fetchData,
  };
};
```

## Information Item Format

```typescript
interface InfoItem {
  id: string;                        // Required: unique identifier
  title: string;                     // Required: main display text
  subtitle?: string;                 // Optional: secondary text
  url?: string;                      // Optional: link when clicked
  timestamp?: Date | string | number // Optional: ISO string, Unix, or Date
}
```

### Timestamps

All these formats are valid:

```typescript
// ISO 8601 string
timestamp: "2024-01-15T10:30:00Z";

// Unix seconds
timestamp: 1705315800;

// Unix milliseconds
timestamp: 1705315800000;

// Date object
timestamp: new Date();
```

## Using Configuration

Read config **in the outer closure** (before `return`), not inside the fetch function. When config changes, Glanceway reloads the entire script, so the outer closure always has fresh values.

Use `GlancewayAPI<Config>` to get type-safe config access:

```typescript
type Config = {
  API_TOKEN: string;
  TAGS: string[];
};

export default async (api: GlancewayAPI<Config>): Promise<SourceMethods> => {
  const token = api.config.get("API_TOKEN");  // string
  const tags = api.config.get("TAGS");        // string[]

  async function fetchData() {
    // use token and tags directly
  }

  await fetchData();

  return {
    refresh: fetchData,
  };
};
```

## Persistent Storage

Store data between refreshes:

```typescript
export default async (api: GlancewayAPI): Promise<SourceMethods> => {
  async function fetchData() {
    const lastId = api.storage.get("lastId");

    const response = await api.fetch<Item[]>("https://api.example.com/items");

    if (!response.ok || !response.json) {
      throw new Error(`Failed to fetch items (HTTP ${response.status})`);
    }

    const items = response.json;
    const newItems = lastId
      ? items.filter((item) => item.id > lastId)
      : items;

    if (newItems.length > 0) {
      api.storage.set("lastId", newItems[0].id);
      api.emit(
        newItems.map((item) => ({
          id: item.id,
          title: item.title,
        })),
      );
    }
  }

  await fetchData();

  return {
    refresh: fetchData,
  };
};
```

## WebSocket Connections

For real-time data sources, use WebSocket in the start phase and skip `refresh`:

```typescript
export default async (api: GlancewayAPI): Promise<SourceMethods> => {
  const ws = await api.websocket.connect("wss://stream.example.com", {
    onConnect(connection) {
      api.log("info", "Connected to stream");
      connection.send(JSON.stringify({ subscribe: "updates" }));
    },

    onMessage(data) {
      const event = JSON.parse(data);
      api.emit([
        {
          id: event.id,
          title: event.message,
          timestamp: event.time,
        },
      ]);
    },

    onError(error) {
      api.log("error", `WebSocket error: ${error}`);
    },

    onClose(code) {
      api.log("info", `Disconnected: ${code}`);
    },
  });

  return {
    stop() {
      ws.close();
    },
  };
};
```

## Error Handling

For the main/only request, throw on failure. For parallel sub-requests, skip failures silently.

```typescript
// Single request: throw on failure
const res = await api.fetch<Article[]>(url);
if (!res.ok || !res.json) {
  throw new Error(`Failed to fetch articles (HTTP ${res.status})`);
}
api.emit(toItems(res.json));
```

## Parallel Requests

Always use `Promise.allSettled` (never `Promise.all`) for parallel requests:

```typescript
await Promise.allSettled(
  ids.map(async (id) => {
    const res = await api.fetch<Item>(
      `https://api.example.com/items/${id}`,
    );
    if (res.ok && res.json) {
      items.push(res.json);
      api.emit(/* ... */);
    }
  }),
);
```

## Development Constraints

- **NO external imports.** The only allowed import is the type import:
  ```typescript
  import type { GlancewayAPI, SourceMethods } from "../../types";
  ```
- All functionality is provided through the `api` parameter.
- **Maximize items per fetch.** The app does not paginate, so fetch as many items as the API allows (hard limit: 500).

## Tips

1. **Use `subtitle`** - Always map descriptive text to subtitle for maximum information at a glance
2. **Handle errors** - Throw on main request failure, skip on parallel sub-request failure
3. **Respect rate limits** - Be mindful of API rate limits
4. **Test locally** - Build with `npm run build-sources -- --source author/name` to verify
5. **Clean up** - Implement `stop()` for WebSocket sources

## Next Steps

- [API Reference](./api-reference.md) - Full API documentation
- [Contributing](../CONTRIBUTING.md) - Submit your source
