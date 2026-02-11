# Glanceway Source Development Guide

This guide covers how to develop custom information sources for Glanceway.

## Source Types

| Type           | Format                                      | Best for                                                 |
| -------------- | ------------------------------------------- | -------------------------------------------------------- |
| **RSS**        | Feed URL in Glanceway                       | Standard RSS/Atom feeds — no development needed          |
| **YAML**       | Single `.yaml` file                         | Simple JSON APIs, straightforward field mapping          |
| **TypeScript** | Directory with `manifest.yaml` + `index.ts` | Complex logic, multiple API calls, WebSocket, pagination |

When in doubt, start with YAML. If you need custom logic, switch to TypeScript.

## Guides

- **[Create a Source with Claude Code](./create-source-with-ai.md)** — Step-by-step guide to generating sources using AI
- **[YAML Source Development](./yaml-source.md)** — YAML format, parsing rules, filters, URL transforms
- **[JS/TS Source Development](./js-source.md)** — TypeScript source lifecycle, storage, WebSocket, pagination
- **[API Reference](./api-reference.md)** — Complete `GlancewayAPI` documentation (`emit`, `fetch`, `config`, `storage`, `websocket`, `log`)

## Categories

Use one of the following for the `category` field:

| Category        | Description                     |
| --------------- | ------------------------------- |
| `Developer`     | Development tools, GitHub, APIs |
| `News`          | News and media                  |
| `Social`        | Social media platforms          |
| `Finance`       | Financial data and markets      |
| `Entertainment` | Games, videos, music            |
| `Productivity`  | Task management, calendars      |
| `Other`         | Anything else                   |

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for PR guidelines, versioning, and submission checklist.
