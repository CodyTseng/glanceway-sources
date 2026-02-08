# Contributing to Glanceway Sources

Thank you for your interest in contributing an information source to Glanceway!

## Quick Start

### 1. Choose Your Source Type

| Type           | When to use                                       | File structure                                    |
| -------------- | ------------------------------------------------- | ------------------------------------------------- |
| **YAML**       | Simple JSON API, no custom logic                  | `sources/<you>/<name>.yaml`                       |
| **TypeScript** | Multiple API calls, complex transforms, WebSocket | `sources/<you>/<name>/manifest.yaml` + `index.ts` |

See the [Development Guide](./docs/README.md) for details on each type.

### 2. Create Your Source

**YAML source** — create the file directly:

```
sources/<your-username>/<source-name>.yaml
```

**TypeScript source** — use the scaffolding CLI:

```bash
npm run create-source
```

This prompts for name, author, description, and category, then generates a starter template under `sources/<your-username>/<source-name>/`.

### 3. Build & Test

```bash
npm run build-sources -- --source your-username/source-name
```

Check the output in `dist/your-username/source-name/`.

### 4. Submit a Pull Request

Fork the repo, commit your source, and open a PR.

## PR Guidelines

### Title Format

```
[New Source] your-username/source-name
```

For updates:

```
[Update] your-username/source-name - v1.1.0
```

### Checklist

- [ ] All required metadata is filled in
- [ ] Builds successfully (`npm run build-sources -- --source your-username/source-name`)
- [ ] No sensitive data (API keys, tokens) is committed
- [ ] No `dist/**` files are included
- [ ] Description clearly explains what the source does

### PR Description Template

```markdown
## New Source: your-username/source-name

**Category**: Developer

**Description**: Brief description of what this source provides

**Testing**:

- [ ] Built successfully with `npm run build-sources`
- [ ] All required config fields documented
```

## Releasing New Versions

1. **Update the version** in `manifest.yaml` (or the YAML source file):

   ```yaml
   version: 1.1.0
   changelog: |
     - Added new feature
     - Fixed bug
   ```

2. **Commit and push** — CI automatically builds the new version, updates `latest.zip`, `sources.json`, and `README.md`.

## Development Documentation

For detailed guides on source development:

- [Development Guide](./docs/README.md) — Overview and source type comparison
- [YAML Sources](./docs/yaml-source.md) — YAML source format and parsing rules
- [JS/TS Sources](./docs/js-source.md) — TypeScript source development
- [API Reference](./docs/api-reference.md) — Complete `GlancewayAPI` documentation

## Code of Conduct

- Be respectful and constructive
- Only submit sources you have the right to share
- Do not submit sources that scrape private data without consent
- Ensure your source respects rate limits

Thank you for contributing!
