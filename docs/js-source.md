# JavaScript Source Development

JavaScript sources provide full control over data fetching and processing.

## Quick Start

Create a new source using the interactive CLI:

```bash
npm run create-source
```

This will prompt you for source name, author, description, and category, then generate the source template.

## Source Structure

After building, your source should have this structure:

```
sources/your-username/my-source/
├── manifest.yaml    # Source metadata
└── index.js         # Source logic
```

## manifest.yaml

```yaml
version: 1.0.0
name: My Source
description: A brief description of what this source provides
author:
  name: Your Name
  url: https://github.com/your-username
category: Developer
tags:
  - example
  - api

# Optional: User-configurable fields
config:
  - key: api_token
    name: API Token
    type: secret
    description: Your API token
    required: true

  - key: username
    name: Username
    type: string
    description: Filter by username (optional)
    required: false

  - key: sort
    name: Sort Order
    type: select # use select with options for fixed value sets
    description: Sort order for results
    required: false
    default: hot
    options:
      - hot
      - new
      - top
```

## Source Lifecycle

1. **Initialization**: Module is loaded and function is called with `api`
2. **refresh()**: Called immediately, then periodically based on user settings
3. **stop()**: Called when source is disabled or removed

## Information Item Format

```typescript
{
  id: string | number,     // Required: unique identifier
  title: string,           // Required: main display text
  subtitle?: string,       // Optional: secondary text
  url?: string,            // Optional: link when clicked
  timestamp?: Date | string | number  // Optional: ISO string, Unix, or Date
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

Access user-configured values defined in manifest.yaml:

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const token = api.config.get("api_token");
      if (!token) {
        api.log("error", "API token is required");
        return;
      }

      const response = await api.fetch("https://api.example.com/items", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ... process response
    },
  };
};
```

## Persistent Storage

Store data between refreshes:

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      // Get last seen item
      const lastId = api.storage.get("lastId");

      const response = await api.fetch("https://api.example.com/items");

      if (response.ok && response.json) {
        const items = (response.json as any).data;

        // Filter to only new items
        const newItems = lastId
          ? items.filter((item: any) => item.id > lastId)
          : items;

        if (newItems.length > 0) {
          // Save newest ID
          api.storage.set("lastId", newItems[0].id);
          api.emit(
            newItems.map((item: any) => ({
              id: item.id,
              title: item.title,
            })),
          );
        }
      }
    },
  };
};
```

## WebSocket Connections

For real-time data:

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  let ws: WebSocketConnection | null = null;

  return {
    async refresh() {
      if (ws) return; // Already connected

      ws = await api.websocket.connect("wss://stream.example.com", {
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
          ws = null;
        },
      });
    },

    stop() {
      if (ws) {
        ws.close();
        ws = null;
      }
    },
  };
};
```

## Error Handling

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const response = await api.fetch("https://api.example.com/items");

      if (!response.ok) {
        api.log("error", `API error: ${response.status}`);
        return;
      }

      if (!response.json) {
        api.log("error", "Invalid JSON response");
        return;
      }

      // Process response...
    },
  };
};
```

## Pagination

Fetch multiple pages:

```typescript
export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const allItems: InfoItem[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 5) {
        // Limit to 5 pages
        const response = await api.fetch(
          `https://api.example.com/items?page=${page}`,
        );

        if (response.ok && response.json) {
          const { data, next_page } = response.json as any;
          allItems.push(
            ...data.map((item: any) => ({
              id: item.id,
              title: item.title,
            })),
          );
          hasMore = !!next_page;
          page++;
        } else {
          break;
        }
      }

      api.emit(allItems);
    },
  };
};
```

## Tips

1. **Keep it simple** - Only fetch what you need
2. **Handle errors** - Always check response status
3. **Respect rate limits** - Be mindful of API rate limits
4. **Test locally** - Verify your source works before submitting
5. **Clean up** - Implement `stop()` for WebSocket sources

## Next Steps

- [API Reference](./api-reference.md) - Full API documentation
- [Contributing](../CONTRIBUTING.md) - Submit your source
