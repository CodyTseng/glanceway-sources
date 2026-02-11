import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      type Article = {
        id: number;
        title: string;
        description: string;
        url: string;
        published_at: string;
        positive_reactions_count: number;
        comments_count: number;
        reading_time_minutes: number;
        user: { name: string };
      };

      const tags = (api.config.get("TAG") as string[] | undefined) ?? [];

      const toItems = (articles: Article[]) =>
        articles.map((article) => ({
          id: article.id.toString(),
          title: article.title,
          subtitle: article.description || `${article.positive_reactions_count} reactions · ${article.comments_count} comments`,
          url: article.url,
          timestamp: article.published_at,
        }));

      if (tags.length > 0) {
        const perPage = Math.min(30, Math.floor(150 / tags.length));
        await Promise.allSettled(
          tags.map(async (tag) => {
            const res = await api.fetch<Article[]>(
              `https://dev.to/api/articles?per_page=${perPage}&top=7&tag=${encodeURIComponent(tag)}`,
            );
            if (res.ok && res.json) {
              api.emit(toItems(res.json));
            }
          }),
        );
      } else {
        const res = await api.fetch<Article[]>(
          "https://dev.to/api/articles?per_page=30&top=7",
        );
        if (!res.ok || !res.json) {
          throw new Error(`Failed to fetch DEV articles (HTTP ${res.status})`);
        }
        api.emit(toItems(res.json));
      }
    },
  };
};
