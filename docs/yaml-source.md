# YAML Source Development

YAML sources let you define data extraction rules for JSON APIs without writing code.

## Basic Structure

```yaml
# Required metadata
version: 1.0.0
name: Display Name
description: Brief description of the source
author: Author Name  # or object with name and url
category: Category
tags:
  - tag1
  - tag2

# Optional: User-configurable fields
config:
  - key: api_token
    name: API Token
    description: Your API token
    required: true

# HTTP source configuration
source:
  url: https://api.example.com/data
  method: GET
  headers:
    Authorization: Bearer ${api_token}

# Parsing rules (JSONPath)
parse:
  root: $.data[*]
  mapping:
    id: $.id
    title: $.name
    subtitle: $.description
    url: $.link
    timestamp: $.created_at
```

## Metadata Fields

| Field | Required | Description |
|-------|----------|-------------|
| `version` | Yes | Semantic version (e.g., `1.0.0`) |
| `name` | Yes | Display name shown in Glanceway |
| `description` | Yes | Brief description of the source |
| `author` | Yes | Author name (string) or object with `name` and `url` |
| `category` | Yes | Category for grouping |
| `tags` | No | Array of tags for filtering |
| `interval` | No | Refresh interval in seconds (default: 300) |

## Categories

Use one of these standard categories:
- `Developer` - Development tools, GitHub, APIs
- `News` - News and media
- `Social` - Social media platforms
- `Finance` - Financial data and markets
- `Entertainment` - Games, videos, music
- `Productivity` - Task management, calendars
- `Other` - Anything else

## Configuration Fields

Define user-configurable values:

```yaml
config:
  - key: api_token
    name: API Token
    type: secret         # string, number, boolean, secret, or select
    description: Your personal API token
    required: true

  - key: username
    name: Username
    type: string
    description: Optional username filter
    required: false
    default: ""

  - key: sort
    name: Sort Order
    type: select         # select requires an options list
    description: Sort order for results
    required: false
    default: hot
    options:
      - hot
      - new
      - top
```

When a config field has a fixed set of possible values, use `type: select` with an `options` array instead of `type: string`.

Reference in source using `${key}`:

```yaml
source:
  url: https://api.example.com/users/${username}/data
  headers:
    Authorization: Bearer ${api_token}
```

## Source Configuration

### URL and Method

```yaml
source:
  url: https://api.example.com/data
  method: GET  # GET, POST, PUT, DELETE (default: GET)
```

### Headers

```yaml
source:
  url: https://api.example.com/data
  headers:
    Authorization: Bearer ${token}
    Accept: application/json
    X-Custom-Header: value
```

### Body (POST/PUT)

```yaml
source:
  url: https://api.example.com/data
  method: POST
  headers:
    Content-Type: application/json
  body: |
    {
      "query": "search term",
      "limit": 20
    }
```

## Parse Section

Use dot-notation paths to extract data from JSON responses. Only simple property access is supported — no array operators (`[*]`, `[0:5]`), no wildcards, no recursive descent.

### Basic Extraction

```yaml
parse:
  root: $.data              # Dot-notation path to the array of items
  mapping:
    id: $.id                # Required: unique identifier
    title: $.title          # Required: main display text
    subtitle: $.description # Optional: secondary text
    url: $.url              # Optional: click URL
    timestamp: $.created_at # Optional: timestamp
```

### Path Syntax

| Expression | Description |
|------------|-------------|
| `$` | Entire response (use when response is a top-level array) |
| `$.property` | Child property of root object |
| `$.a.b.c` | Nested property access via dot notation |

### Examples

```yaml
# Response is a top-level array: [{...}, {...}]
parse:
  root: $
  mapping:
    id: $.id
    title: $.title

# Response has a nested array: {"data": {"results": [...]}}
parse:
  root: $.data.results
  mapping:
    title: $.content.title

# Each item has nested fields: [{"metadata": {"display_name": "..."}}]
parse:
  root: $.data
  mapping:
    title: $.metadata.display_name
```

### Base URL

Use `baseUrl` to prepend a base URL to relative paths extracted from the response:

```yaml
parse:
  root: $.items
  mapping:
    id: $.id
    title: $.title
    url: $.path             # e.g., "/articles/123"
  baseUrl: https://example.com  # url becomes "https://example.com/articles/123"
```

## Field Mappings

### Required Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier for each item |
| `title` | Main display text |

### Optional Fields

| Field | Description |
|-------|-------------|
| `subtitle` | Secondary text below title |
| `url` | Link when item is clicked |
| `timestamp` | Time associated with item |

### Timestamp Formats

Supported timestamp formats:
- ISO 8601: `2024-01-15T10:30:00Z`
- Unix seconds: `1705315800`
- Unix milliseconds: `1705315800000`

## Filters

Filter items inside the `parse` section:

```yaml
parse:
  root: $.data
  mapping:
    id: $.id
    title: $.title
  filter:
    - field: $.type
      equals: "article"
    - field: $.status
      notEquals: "draft"
```

### Filter Operations

| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `notEquals` | Not equal |
| `contains` | Contains substring |
| `notContains` | Does not contain substring |
| `matches` | Regex match |
| `exists` | Field exists (true/false) |
| `empty` | Field is empty (true/false) |

## URL Transformations

Transform URLs using regex inside the `parse` section:

```yaml
parse:
  root: $.data
  mapping:
    id: $.id
    title: $.title
    url: $.api_url
  urlTransform:
    - pattern: /api/
      replacement: /web/
```

Supports capture groups (`$1`, `$2`, etc.) in `replacement`.

## Complete Example

```yaml
version: 1.0.0
name: Dev.to
description: Top articles from Dev.to
author: example
category: Developer
tags:
  - dev
  - articles

source:
  url: https://dev.to/api/articles?per_page=30&top=7
  method: GET

parse:
  root: $
  mapping:
    id: $.id
    title: $.title
    subtitle: $.description
    url: $.url
    timestamp: $.published_at
```

## Tips

1. **Test your JSONPath** - Use tools like [JSONPath Online](https://jsonpath.com/) to test expressions
2. **Start simple** - Begin with basic extraction, add filters later
3. **Check API docs** - Understand the API response structure first
4. **Use config for secrets** - Never hardcode API tokens

## When to Use TypeScript Instead

Consider a TypeScript source when you need:
- Multiple API calls
- Complex data transformations
- WebSocket connections
- Pagination handling
- OAuth authentication

See [JS Source Development](./js-source.md) for more.
