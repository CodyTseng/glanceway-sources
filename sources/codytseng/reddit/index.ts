import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const subreddits = (api.config.get("SUBREDDIT") as string[] | undefined) ?? ["programming"];
      const subreddit = subreddits.join("+");
      const sort = (api.config.get("SORT") as string) || "hot";

      const response = await api.fetch<{
        data: {
          children: Array<{
            data: {
              id: string;
              title: string;
              url: string;
              permalink: string;
              selftext: string;
              score: number;
              num_comments: number;
              subreddit_name_prefixed: string;
              author: string;
              created_utc: number;
            };
          }>;
        };
      }>(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=30&raw_json=1`, {
        headers: { "User-Agent": "Glanceway/1.0" },
      });

      if (!response.ok || !response.json) {
        throw new Error(`Failed to fetch Reddit posts from r/${subreddit} (HTTP ${response.status})`);
      }

      api.emit(
        response.json.data.children.map((child) => {
          const post = child.data;
          return {
            id: post.id,
            title: post.title,
            subtitle: post.selftext || `↑ ${post.score} · ${post.num_comments} comments · u/${post.author}`,
            url: post.url.startsWith("/")
              ? `https://www.reddit.com${post.url}`
              : post.url,
            timestamp: post.created_utc,
          };
        }),
      );
    },
  };
};
