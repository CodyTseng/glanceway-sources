import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      type Question = {
        question_id: number;
        title: string;
        link: string;
        score: number;
        answer_count: number;
        view_count: number;
        tags: string[];
        creation_date: number;
      };

      const tagConfig = api.config.get("TAG");
      const sort = api.config.get("SORT") || "hot";
      const tags = tagConfig
        ? tagConfig.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const toItems = (questions: Question[]) =>
        questions.map((q) => ({
          id: q.question_id.toString(),
          title: q.title,
          subtitle: `${q.score} votes · ${q.answer_count} answers · ${q.tags.slice(0, 3).join(", ")}`,
          url: q.link,
          timestamp: q.creation_date,
        }));

      if (tags.length > 0) {
        const pageSize = Math.min(30, Math.floor(150 / tags.length));
        await Promise.all(
          tags.map(async (tag) => {
            const res = await api.fetch<{ items: Question[] }>(
              `https://api.stackexchange.com/2.3/questions?order=desc&sort=${sort}&site=stackoverflow&pagesize=${pageSize}&tagged=${encodeURIComponent(tag)}`,
            );
            if (!res.ok || !res.json) {
              throw new Error(`Failed to fetch Stack Overflow questions for tag "${tag}" (HTTP ${res.status})`);
            }
            api.emit(toItems(res.json.items));
          }),
        );
      } else {
        const res = await api.fetch<{ items: Question[] }>(
          `https://api.stackexchange.com/2.3/questions?order=desc&sort=${sort}&site=stackoverflow&pagesize=30`,
        );
        if (!res.ok || !res.json) {
          throw new Error(`Failed to fetch Stack Overflow questions (HTTP ${res.status})`);
        }
        api.emit(toItems(res.json.items));
      }
    },
  };
};
