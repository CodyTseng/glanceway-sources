const en = {
  // Hero
  "hero.title": "Everything at a glance",
  "hero.description": "A lightweight macOS menu bar app that keeps you updated with what matters — developer news, social feeds, alerts, and more.",
  "hero.tagline": "No distractions, no overload.",
  "hero.download": "Download for macOS",
  "hero.comingSoon": "Coming Soon",
  "hero.browseSources": "Browse Sources",

  // Features section
  "features.title": "Why Glanceway?",
  "features.subtitle": "Stay aware of what's happening — without the noise.",
  "features.lightweight.title": "Lightweight",
  "features.lightweight.description": "Lives in your macOS menu bar. A quick glance is all you need — no need to switch apps or open a browser.",
  "features.richSources.title": "All-in-One Awareness",
  "features.richSources.description": "Breaking news, GitHub notifications, stock prices, Reddit trends, RSS feeds — stay on top of everything from a single menu bar.",
  "features.extensible.title": "Extensible",
  "features.extensible.description": "Write your own sources with simple YAML config or TypeScript plugins, or let AI generate them for you.",
  "features.rss.title": "RSS Compatible",
  "features.rss.description": "Import any RSS/Atom feed URL and start receiving updates instantly.",

  // Sources section
  "sources.title": "Sources",
  "sources.subtitle": "Community-built sources. One click to install.",
  "sources.rssNote": "Also supports importing RSS feed URLs directly. Explore thousands of routes on",
  "sources.submitSource": "Submit a Source",
  "sources.emptyTitle": "No sources in this category yet",
  "sources.emptySubtitle": "Be the first to build one!",

  // Categories
  "category.All": "All",
  "category.Developer": "Developer",
  "category.News": "News",
  "category.Social": "Social",
  "category.Finance": "Finance",
  "category.Entertainment": "Entertainment",
  "category.Productivity": "Productivity",
  "category.Other": "Other",

  // Source detail
  "detail.allSources": "All sources",
  "detail.install": "Install in Glanceway",
  "detail.download": "Download",
  "detail.configuration": "Configuration",
  "detail.sourceCode": "Source Code",
  "detail.by": "by",

  // Config table headers
  "config.name": "Name",
  "config.key": "Key",
  "config.type": "Type",
  "config.required": "Required",
  "config.default": "Default",
  "config.description": "Description",
  "config.yes": "Yes",
  "config.no": "No",

  // Nav
  "nav.sources": "Sources",

  // Footer
  "footer.copyright": "© {year} Glanceway",

  // Language switcher
  "language.label": "Language",
} as const;

export type TranslationKey = keyof typeof en;
export default en;
