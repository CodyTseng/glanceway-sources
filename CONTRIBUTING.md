# Contributing

Thanks for your interest in contributing a source to [Glanceway](https://glanceway.app)!

## Creating a Source

### JavaScript

Use the scaffolding tool to create a standalone project with build/test tooling:

```bash
npm create glanceway-source
```

See the [create-glanceway-source README](create-glanceway-source/README.md) for the full development guide.

### YAML

YAML sources are single-file definitions for simple JSON APIs — no build step needed. See the [YAML Source Development](docs/yaml-source.md) guide.

Not sure which to pick? If you only need data from a single JSON API with straightforward field mapping, use YAML. For anything more complex, use JavaScript.

## Submitting a Source

[Open an issue](https://github.com/codytseng/glanceway-sources/issues) with a link to your source project repository. We'll review it and add it to the collection.

## Reference

- [JS/TS Source Development](docs/js-source.md) — JavaScript source scaffold and tooling
- [YAML Source Development](docs/yaml-source.md) — YAML format, parsing rules, filters
