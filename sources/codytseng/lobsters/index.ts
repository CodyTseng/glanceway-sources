import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const tagConfig = api.config.get("TAG");
      const url = tagConfig
        ? `https://lobste.rs/t/${tagConfig.split(",").map((t) => t.trim()).filter(Boolean).join(",")}.json`
        : "https://lobste.rs/hottest.json";

      const response = await api.fetch<
        Array<{
          short_id: string;
          title: string;
          url: string;
          comments_url: string;
          score: number;
          comment_count: number;
          tags: string[];
          submitter_user: { username: string };
          created_at: string;
        }>
      >(url);

      if (!response.ok || !response.json) {
        throw new Error(`Failed to fetch Lobsters stories (HTTP ${response.status})`);
      }

      api.emit(
        response.json.slice(0, 30).map((story) => ({
          id: story.short_id,
          title: story.title,
          subtitle: story.description || `${story.score} points · ${story.comment_count} comments · ${story.tags.join(", ")}`,
          url: story.url || story.comments_url,
          timestamp: story.created_at,
        })),
      );
    },
  };
};
