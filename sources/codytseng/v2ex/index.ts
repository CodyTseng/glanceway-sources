import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      type Topic = {
        id: number;
        title: string;
        content: string;
        url: string;
        replies: number;
        node: { title: string };
        member: { username: string };
        created: number;
      };

      const nodeName = api.config.get("NODE_NAME");

      const toItems = (topics: Topic[]) =>
        topics.map((topic) => ({
          id: topic.id.toString(),
          title: topic.title,
          subtitle: `${topic.node.title} · ${topic.replies} 回复 · ${topic.member.username}`,
          url: topic.url,
          timestamp: topic.created,
        }));

      if (nodeName) {
        const nodes = nodeName.split(",").map((n) => n.trim()).filter(Boolean);
        await Promise.all(
          nodes.map(async (node) => {
            const res = await api.fetch<Topic[]>(
              `https://www.v2ex.com/api/topics/show.json?node_name=${encodeURIComponent(node)}`,
            );
            if (!res.ok || !res.json) {
              throw new Error(`Failed to fetch V2EX topics for node "${node}" (HTTP ${res.status})`);
            }
            api.emit(toItems(res.json));
          }),
        );
      } else {
        const res = await api.fetch<Topic[]>(
          "https://www.v2ex.com/api/topics/hot.json",
        );
        if (!res.ok || !res.json) {
          throw new Error(`Failed to fetch V2EX hot topics (HTTP ${res.status})`);
        }
        api.emit(toItems(res.json));
      }
    },
  };
};
