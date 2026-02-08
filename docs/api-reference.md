# JavaScript API Reference

Complete reference for the Glanceway Source API.

## API Object

The API object is passed to your source's main function:

```javascript
module.exports = (api) => {
  // api is available here
  return {
    refresh() { /* ... */ },
    stop() { /* ... */ }
  };
};
```

## api.emit(items)

Sends information items to Glanceway for display.

```typescript
emit(items: InfoItem[]): void
```

### InfoItem

```typescript
interface InfoItem {
  id: string | number;              // Required: unique identifier
  title: string;                    // Required: main display text
  subtitle?: string;                // Optional: secondary text
  url?: string;                     // Optional: clickable link
  timestamp?: Date | string | number; // Optional: item time
}
```

### Example

```javascript
api.emit([
  {
    id: '123',
    title: 'New notification',
    subtitle: 'From repository',
    url: 'https://github.com/...',
    timestamp: '2024-01-15T10:30:00Z'
  }
]);
```

### Timestamp Formats

All of these are valid:

```javascript
// ISO 8601 string
timestamp: '2024-01-15T10:30:00Z'

// Unix timestamp (seconds)
timestamp: 1705315800

// Unix timestamp (milliseconds)
timestamp: 1705315800000

// JavaScript Date object
timestamp: new Date()
```

---

## api.fetch(url, options?)

Makes HTTP requests.

```typescript
fetch(url: string, options?: FetchOptions): Promise<FetchResponse>
```

### FetchOptions

```typescript
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';  // Default: 'GET'
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;  // Milliseconds, default: 30000
}
```

### FetchResponse

```typescript
interface FetchResponse {
  ok: boolean;                      // true if status 200-299
  status: number;                   // HTTP status code
  headers: Record<string, string>;  // Response headers
  text: string;                     // Raw response body
  json?: unknown;                   // Parsed JSON (if valid)
}
```

### Examples

#### GET Request

```javascript
const response = await api.fetch('https://api.example.com/data');

if (response.ok && response.json) {
  const data = response.json;
  // Process data...
}
```

#### POST Request

```javascript
const response = await api.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({
    query: 'search term'
  })
});
```

#### With Timeout

```javascript
const response = await api.fetch('https://slow-api.example.com/data', {
  timeout: 60000  // 60 seconds
});
```

---

## api.log(level, message)

Logs messages for debugging.

```typescript
log(level: 'info' | 'error' | 'warn' | 'debug', message: string): void
```

### Examples

```javascript
api.log('info', 'Starting refresh');
api.log('debug', `Fetched ${items.length} items`);
api.log('warn', 'Rate limit approaching');
api.log('error', 'Failed to connect');
```

---

## api.storage

Persistent key-value storage that survives between refreshes.

```typescript
interface StorageAPI {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
```

### Examples

```javascript
// Store a value
api.storage.set('lastId', '12345');
api.storage.set('cache', { items: [...], updated: Date.now() });

// Retrieve a value
const lastId = api.storage.get('lastId');
const cache = api.storage.get('cache');

// Check if exists
const value = api.storage.get('key');
if (value !== undefined) {
  // Use value
}
```

### Use Cases

- Tracking last seen item ID
- Caching data between refreshes
- Storing pagination cursors
- Remembering user preferences

---

## api.config

Access user-configured values from manifest.yaml.

```typescript
interface ConfigAPI {
  get(key: string): string | undefined;
  getAll(): Record<string, string>;
}
```

### manifest.yaml Configuration

```yaml
config:
  - key: api_token
    name: API Token
    description: Your API token
    required: true

  - key: filter
    name: Filter
    description: Optional filter
    required: false
```

### Examples

```javascript
// Get single value
const token = api.config.get('api_token');
const filter = api.config.get('filter');

// Check required config
if (!token) {
  api.log('error', 'API token is required');
  return;
}

// Get all config values
const allConfig = api.config.getAll();
// { api_token: '...', filter: '...' }
```

---

## api.websocket

Create WebSocket connections for real-time data.

```typescript
interface WebSocketAPI {
  connect(url: string, callbacks: WebSocketCallbacks): Promise<WebSocketConnection>;
}

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

### Example

```javascript
module.exports = (api) => {
  let connection = null;

  return {
    async refresh() {
      if (connection) return;

      connection = await api.websocket.connect('wss://stream.example.com', {
        onConnect(ws) {
          api.log('info', 'Connected');
          ws.send(JSON.stringify({ type: 'subscribe' }));
        },

        onMessage(data) {
          const event = JSON.parse(data);
          api.emit([{
            id: event.id,
            title: event.message
          }]);
        },

        onError(error) {
          api.log('error', `Error: ${error}`);
        },

        onClose(code) {
          api.log('info', `Closed: ${code}`);
          connection = null;
        }
      });
    },

    stop() {
      if (connection) {
        connection.close();
        connection = null;
      }
    }
  };
};
```

---

## Source Export

Your source module must export a function that receives the API and returns source methods.

```typescript
type SourceExport = (api: GlancewayAPI) => SourceMethods | void;

interface SourceMethods {
  refresh?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
}
```

### refresh()

Called when the source starts and periodically based on user settings.

```javascript
module.exports = (api) => {
  return {
    async refresh() {
      // Fetch and emit data
    }
  };
};
```

### stop()

Called when the source is stopped or removed. Use for cleanup.

```javascript
module.exports = (api) => {
  let interval = null;

  return {
    refresh() {
      interval = setInterval(() => {
        // Custom polling
      }, 5000);
    },

    stop() {
      if (interval) {
        clearInterval(interval);
      }
    }
  };
};
```

---

## TypeScript Definitions

For TypeScript development, here are the complete type definitions:

```typescript
// === Main API Interface ===
interface GlancewayAPI {
  emit(items: InfoItem[]): void;
  fetch(url: string, options?: FetchOptions): Promise<FetchResponse>;
  log(level: 'info' | 'error' | 'warn' | 'debug', message: string): void;
  storage: StorageAPI;
  config: ConfigAPI;
  websocket: WebSocketAPI;
}

// === Information Item ===
interface InfoItem {
  id: string | number;
  title: string;
  subtitle?: string;
  url?: string;
  timestamp?: Date | string | number;
}

// === HTTP Fetch ===
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  text: string;
  json?: unknown;
}

// === Storage ===
interface StorageAPI {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

// === Config ===
interface ConfigAPI {
  get(key: string): string | undefined;
  getAll(): Record<string, string>;
}

// === WebSocket ===
interface WebSocketAPI {
  connect(url: string, callbacks: WebSocketCallbacks): Promise<WebSocketConnection>;
}

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

// === Source Export ===
type SourceExport = (api: GlancewayAPI) => SourceMethods | void;

interface SourceMethods {
  refresh?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
}

declare const module: { exports: SourceExport };
```

Create a new source using the interactive CLI:

```bash
npm run create-source
```
