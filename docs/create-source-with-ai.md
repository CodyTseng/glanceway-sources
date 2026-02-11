# Using Claude Code to Create a Glanceway Source

This guide walks you through using [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to generate a custom Glanceway source.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- [Node.js](https://nodejs.org/) (v18+)

## Step 1: Clone and Set Up

```bash
git clone https://github.com/codytseng/glanceway-sources.git
cd glanceway-sources
npm install
```

## Step 2: Launch Claude Code

```bash
claude
```

Claude Code will automatically read the project's `CLAUDE.md` and understand the source structure, API, and coding conventions.

## Step 3: Describe What You Want

Tell Claude what data source you'd like. The more specific you are about the API and what fields to display, the better the result.

### Example Prompts

> Create a source that shows top news from NewsAPI.org. I have an API key.

> Create a source for monitoring GitHub Actions workflow runs. The user should configure their GitHub token and repository name.

> Create a source that shows the top 20 most played games on Steam right now.

> Create a source that displays recent significant earthquakes from the USGS API.

### Tips for Better Results

- **Provide the API URL** if you know it — Claude can figure out the response format, but an exact URL saves time.
- **Mention authentication** — if the API needs a token, say so. Claude will add the appropriate config field.
- **Specify what to show** — mention which fields should appear as title, subtitle, and URL.

## Step 4: Build and Verify

Ask Claude to build the source:

> Build my new source

Or run it manually:

```bash
npm run build-sources -- --source <author>/<source-name>
```

A successful build confirms the TypeScript compiles correctly. Check the output in `dist/<author>/<source-name>/`.

## Step 5: Install in Glanceway

1. Open Glanceway
2. Go to Sources > Import from file
3. Select the generated `.zip` or `.yaml` file from the `dist/` directory
4. Configure any required settings (API keys, etc.)

## Example Session

```
You: Create a source that shows trending repositories on GitHub this week,
     with the repo name, description, stars, and language. Let the user
     filter by programming language.

Claude: [scaffolds the source, implements the code, builds it]

You: Build it

Claude: ✅ Built successfully — dist/yourname/github-trending/1.0.0.zip
```

## Troubleshooting

- **Build fails** — Ask Claude to fix the error. Paste the error message if it doesn't see it automatically.
- **Wrong data mapping** — Tell Claude which fields are incorrect and what they should be.
- **Missing config** — Ask Claude to add a config field, e.g., "Add a config option for the API key".
