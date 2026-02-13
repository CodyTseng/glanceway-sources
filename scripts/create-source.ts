import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";

const SOURCES_DIR = path.join(process.cwd(), "sources");

const CATEGORIES = [
  "Developer",
  "News",
  "Social",
  "Finance",
  "Entertainment",
  "Productivity",
  "Other",
];

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

function validateName(value: string): string | true {
  if (!value) return "Source name is required";
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return "Source name must be lowercase, start with a letter, and use only letters, numbers, and hyphens";
  }
  return true;
}

function validateAuthor(value: string): string | true {
  if (!value) return "Author is required";
  if (!/^[a-zA-Z0-9-]+$/.test(value)) {
    return "Author can only contain letters, numbers, and hyphens";
  }
  return true;
}

function validateCategory(value: string): string | true {
  if (!CATEGORIES.includes(value)) {
    return `Category must be one of: ${CATEGORIES.join(", ")}`;
  }
  return true;
}

function generateManifest(options: {
  name: string;
  description: string;
  author: string;
  authorUrl?: string;
  category: string;
  tags?: string[];
}): string {
  let manifest = `version: 1.0.0
name: ${options.name}
description: ${options.description}
author: ${options.author}
`;

  if (options.authorUrl) {
    manifest += `author_url: ${options.authorUrl}\n`;
  }

  const tagsStr =
    options.tags && options.tags.length > 0
      ? `\n${options.tags.map((t) => `  - ${t}`).join("\n")}`
      : " []";

  manifest += `category: ${options.category}
tags:${tagsStr}

# Optional: Add configuration fields
# config:
#   - key: API_TOKEN
#     name: API Token
#     type: secret           # string, number, boolean, secret, select, or list
#     required: true
#     description: Your API token
#   - key: SORT
#     name: Sort Order
#     type: select           # use select with options for fixed value sets
#     required: false
#     default: hot
#     options:
#       - hot
#       - new
#       - top
`;

  return manifest;
}

const INDEX_TEMPLATE = `import type { GlancewayAPI, SourceMethods } from "../../types";

export default async (api: GlancewayAPI): Promise<SourceMethods> => {
  async function fetchData() {
    // Example: Fetch data from an API
    const response = await api.fetch("https://api.example.com/items");

    if (response.ok && response.json) {
      const items = response.json.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      }));
      api.emit(items);
    }
  }

  // Start phase: initial fetch
  await fetchData();

  return {
    refresh: fetchData,
  };
};
`;

function toDisplayName(sourceName: string): string {
  return sourceName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  console.log("🚀 Create a new Glanceway source\n");

  // Ensure sources directory exists
  if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
  }

  const args = parseArgs();

  // Check if all required args are provided for non-interactive mode
  const hasAllRequired =
    args["name"] &&
    args["author"] &&
    args["display-name"] &&
    args["description"] &&
    args["category"];

  if (hasAllRequired) {
    return createNonInteractive(args);
  }

  return createInteractive();
}

function createNonInteractive(args: Record<string, string>) {
  const sourceName = args["name"];
  const author = args["author"].toLowerCase().replace(/-+/g, "-");
  const displayName = args["display-name"];
  const description = args["description"];
  const category = args["category"];
  const authorUrl = args["author-url"];
  const tags = args["tags"]
    ? args["tags"].split(",").map((t) => t.trim())
    : undefined;

  // Validate
  const nameCheck = validateName(sourceName);
  if (nameCheck !== true) {
    console.error(`❌ ${nameCheck}`);
    process.exit(1);
  }

  const authorCheck = validateAuthor(author);
  if (authorCheck !== true) {
    console.error(`❌ ${authorCheck}`);
    process.exit(1);
  }

  if (!description) {
    console.error("❌ Description is required");
    process.exit(1);
  }

  const categoryCheck = validateCategory(category);
  if (categoryCheck !== true) {
    console.error(`❌ ${categoryCheck}`);
    process.exit(1);
  }

  const sourcePath = path.join(SOURCES_DIR, author, sourceName);
  if (fs.existsSync(sourcePath)) {
    console.error(`❌ Source "${author}/${sourceName}" already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(sourcePath, { recursive: true });

  const manifest = generateManifest({
    name: displayName,
    description,
    author,
    authorUrl,
    category,
    tags,
  });
  fs.writeFileSync(path.join(sourcePath, "manifest.yaml"), manifest);
  fs.writeFileSync(path.join(sourcePath, "index.ts"), INDEX_TEMPLATE);

  console.log(`
✅ Created sources/${author}/${sourceName}/
   - manifest.yaml
   - index.ts

Next steps:
1. Edit index.ts to implement your source logic
2. Update manifest.yaml with any config fields needed
3. Test locally: npm run build-sources -- --source ${author}/${sourceName}
4. Submit a PR!
`);
}

async function createInteractive() {
  let sourceName: string;
  let author: string;
  let sourcePath: string;

  // Loop until we get a valid, non-existing source
  while (true) {
    const response = await prompts([
      {
        type: "text",
        name: "sourceName",
        message: "Source name (lowercase-with-hyphens):",
        validate: (value) => validateName(value),
      },
      {
        type: "text",
        name: "author",
        message: "Author:",
        initial: "anonymous",
        validate: (value) => validateAuthor(value),
      },
    ]);

    if (!response.sourceName || !response.author) {
      console.log("\n❌ Cancelled");
      process.exit(1);
    }

    sourceName = response.sourceName;
    author = response.author.toLowerCase().replace(/-+/g, "-");
    sourcePath = path.join(SOURCES_DIR, author, sourceName);

    if (fs.existsSync(sourcePath)) {
      console.log(`\n❌ Source "${author}/${sourceName}" already exists.\n`);
      continue;
    }

    break;
  }

  const response = await prompts([
    {
      type: "text",
      name: "displayName",
      message: "Display name:",
      initial: toDisplayName(sourceName),
    },
    {
      type: "text",
      name: "description",
      message: "Description:",
      validate: (value) => (value ? true : "Description is required"),
    },
    {
      type: "text",
      name: "authorUrl",
      message: "Author URL (optional):",
      initial: `https://github.com/${author}`,
    },
    {
      type: "select",
      name: "category",
      message: "Category:",
      choices: CATEGORIES.map((c) => ({ title: c, value: c })),
    },
  ]);

  if (!response.displayName || !response.description || !response.category) {
    console.log("\n❌ Cancelled");
    process.exit(1);
  }

  // Create directory
  fs.mkdirSync(sourcePath, { recursive: true });

  // Create manifest.yaml
  const manifest = generateManifest({
    name: response.displayName,
    description: response.description,
    author,
    authorUrl: response.authorUrl || undefined,
    category: response.category,
  });

  fs.writeFileSync(path.join(sourcePath, "manifest.yaml"), manifest);

  // Create index.ts
  fs.writeFileSync(path.join(sourcePath, "index.ts"), INDEX_TEMPLATE);

  console.log(`
✅ Created sources/${author}/${sourceName}/
   - manifest.yaml
   - index.ts

Next steps:
1. Edit index.ts to implement your source logic
2. Update manifest.yaml with any config fields needed
3. Test locally: npm run build-sources -- --source ${author}/${sourceName}
4. Submit a PR!
`);
}

main().catch(console.error);
