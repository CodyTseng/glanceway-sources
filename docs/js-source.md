# JavaScript Source Development

JavaScript sources provide full control over data fetching and processing.

## Getting Started

Use [`create-glanceway-source`](../create-glanceway-source/README.md) to scaffold a standalone project with build tooling, test framework, and full API documentation:

```bash
npm create glanceway-source
```

The generated project includes everything you need: source template, type definitions, build scripts, test runner, and detailed development guide. See the project's README for full usage details.

## JavaScript API Reference

Complete reference for the Glanceway Source API.

### API Object

The API object is passed to your source's default export function:

```javascript
export default async (api) => {
  async function fetchData() {
    /* fetch, transform, emit */
  }

  await fetchData();

  return {
    refresh: fetchData,
    stop() {
      /* optional cleanup */
    },
  };
};
```

---

### api.emit(items)

Sends information items to Glanceway for display.

#### InfoItem

```typescript
interface InfoItem {
  id: string; // Required: unique identifier
  title: string; // Required: main display text
  subtitle?: string; // Optional: secondary text
  url?: string; // Optional: clickable link
  timestamp?: Date | string | number; // Optional: item time
}
```

#### Example

```javascript
api.emit([
  {
    id: "123",
    title: "New notification",
    subtitle: "From repository",
    url: "https://github.com/...",
    timestamp: "2024-01-15T10:30:00Z",
  },
]);
```

#### Timestamp Formats

All of these are valid:

```javascript
// ISO 8601 string
timestamp: "2024-01-15T10:30:00Z";

// Unix timestamp (seconds)
timestamp: 1705315800;

// Unix timestamp (milliseconds)
timestamp: 1705315800000;

// JavaScript Date object
timestamp: new Date();
```

---

### api.fetch(url, options?)

Makes HTTP requests.

#### FetchOptions

```typescript
interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // Default: 'GET'
  headers?: Record<string, string>;
  body?: string;
  timeout?: number; // Milliseconds, default: 30000
}
```

#### FetchResponse

```typescript
interface FetchResponse {
  ok: boolean; // true if status 200-299
  status: number; // HTTP status code
  headers: Record<string, string>; // Response headers
  text: string; // Raw response body
  json?: any; // Parsed JSON (if valid)
  error?: string; // Error message if request failed
}
```

#### Examples

##### GET Request

```javascript
const response = await api.fetch("https://api.example.com/data");

if (response.ok && response.json) {
  const articles = response.json.items;
}
```

##### POST Request

```javascript
const response = await api.fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token123",
  },
  body: JSON.stringify({
    query: "search term",
  }),
});
```

##### With Timeout

```javascript
const response = await api.fetch("https://slow-api.example.com/data", {
  timeout: 60000, // 60 seconds
});
```

---

### api.log(level, message)

Logs messages for debugging. Levels: `"info"`, `"error"`, `"warn"`, `"debug"`.

#### Examples

```javascript
api.log("info", "Starting refresh");
api.log("debug", `Fetched ${items.length} items`);
api.log("warn", "Rate limit approaching");
api.log("error", "Failed to connect");
```

---

### api.storage

Persistent key-value storage that survives between refreshes and app restarts.

```typescript
interface StorageAPI {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}
```

#### Use Cases

- Tracking last seen item ID
- Caching data between refreshes (e.g., company names)
- Storing pagination cursors
- Remembering state for change detection

---

### api.config

Access user-configured values from manifest.yaml.

#### manifest.yaml Configuration

```yaml
config:
  - key: API_TOKEN
    name: API Token
    type: secret
    description: Your API token
    required: true

  - key: TAGS
    name: Tags
    type: list
    description: Tags to filter by
    required: false
```

#### Examples

```javascript
export default async (api) => {
  const token = api.config.get("API_TOKEN"); // string
  const tags = api.config.get("TAGS"); // string[]

  // Get all config values
  const allConfig = api.config.getAll();

  // ...
};
```

---

### api.appVersion

Current Glanceway app version string (e.g., `"1.2.0"`).

```javascript
api.log("info", `Running on Glanceway ${api.appVersion}`);
```

---

### api.websocket

Create WebSocket connections for real-time data.

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

#### Example

```javascript
export default async (api) => {
  const ws = await api.websocket.connect("wss://stream.example.com", {
    onConnect(connection) {
      api.log("info", "Connected");
      connection.send(JSON.stringify({ type: "subscribe" }));
    },

    onMessage(data) {
      const event = JSON.parse(data);
      api.emit([
        {
          id: event.id,
          title: event.message,
        },
      ]);
    },

    onError(error) {
      api.log("error", `Error: ${error}`);
    },

    onClose(code) {
      api.log("info", `Closed: ${code}`);
    },
  });

  return {
    stop() {
      ws.close();
    },
  };
};
```

---

### Source Export

Your source module must export an async function that receives the API and returns an object with optional `refresh` and `stop` methods.

```typescript
interface SourceMethods {
  refresh?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
}
```

#### Start Phase (Default Export)

The default export function runs when the source is loaded. It should `await` the initial data fetch before returning. The app does NOT call `refresh()` on initial load.

```javascript
export default async (api) => {
  async function fetchData() {
    // Fetch and emit data
  }

  await fetchData();

  return {
    refresh: fetchData,
  };
};
```

#### refresh()

Called periodically based on user settings. NOT called on initial load.

#### stop()

Called when the source is stopped or removed. Use for cleanup (e.g., closing WebSocket connections).

---

### TypeScript Type Definitions

For TypeScript development, import types from `../../types`:

```typescript
import type { GlancewayAPI, SourceMethods } from "../../types";
```

The complete type definitions are available in the `sources/types.ts` file. Key interfaces:

- `GlancewayAPI<TConfig>` - Main API object (supports Config generic)
- `SourceMethods` - Return type with `refresh` and `stop`
- `InfoItem` - Item emitted for display
- `FetchOptions` / `FetchResponse<T>` - HTTP request/response types
- `WebSocketCallbacks` / `WebSocketConnection` - WebSocket types

Create a new source project:

```bash
npm create glanceway-source
```
