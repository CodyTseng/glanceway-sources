import type { TranslationKey } from "./en";

const zh: Record<TranslationKey, string> = {
  // Hero
  "hero.title": "一瞥",
  "hero.description":
    "一款轻量级 macOS 菜单栏应用，让你随时掌握重要动态——开发者资讯、社交动态、提醒通知等",
  "hero.tagline": "不打扰，不过载",
  "hero.download": "下载 macOS 版",
  "hero.comingSoon": "即将发布",
  "hero.browseSources": "浏览信息源",

  // Features section
  "features.title": "为什么选择 Glanceway？",
  "features.subtitle": "保持对世界的感知，而非被信息淹没。",
  "features.lightweight.title": "轻量级",
  "features.lightweight.description": "常驻 macOS 菜单栏，瞥一眼即可掌握动态——无需切换应用或打开浏览器。",
  "features.richSources.title": "一站式感知",
  "features.richSources.description": "突发新闻、GitHub 通知、股票行情、Reddit 热帖、RSS 订阅——在一个菜单栏里掌握一切。",
  "features.extensible.title": "可扩展",
  "features.extensible.description": "通过简单的 YAML 配置或 TypeScript 插件编写自定义信息源，也可以让 AI 帮你生成。",
  "features.rss.title": "兼容 RSS",
  "features.rss.description": "导入任意 RSS/Atom 订阅链接，即刻接收更新。",

  // Sources section
  "sources.title": "信息源",
  "sources.subtitle": "社区构建的信息源，一键安装。",
  "sources.rssNote": "也支持直接导入 RSS 订阅链接。在以下平台探索数千种路由",
  "sources.submitSource": "提交信息源",
  "sources.emptyTitle": "该分类暂无信息源",
  "sources.emptySubtitle": "成为第一个构建者吧！",

  // Categories
  "category.All": "全部",
  "category.Developer": "开发者",
  "category.News": "新闻",
  "category.Social": "社交",
  "category.Finance": "财经",
  "category.Entertainment": "娱乐",
  "category.Productivity": "效率",
  "category.Other": "其他",

  // Source detail
  "detail.allSources": "所有信息源",
  "detail.install": "安装到 Glanceway",
  "detail.download": "下载",
  "detail.configuration": "配置项",
  "detail.sourceCode": "源代码",
  "detail.by": "作者",

  // Config table headers
  "config.name": "名称",
  "config.key": "键",
  "config.type": "类型",
  "config.required": "必填",
  "config.default": "默认值",
  "config.description": "描述",
  "config.yes": "是",
  "config.no": "否",

  // Nav
  "nav.sources": "信息源",

  // Footer
  "footer.copyright": "© {year} Glanceway",

  // Language switcher
  "language.label": "语言",
};

export default zh;
