import type { GlancewayAPI, SourceMethods } from "../../types";

export default (api: GlancewayAPI): SourceMethods => {
  return {
    async refresh() {
      const urlsConfig = api.config.get("URLS");
      if (!urlsConfig) return;

      const urls = urlsConfig
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const previousDownUrls = new Set<string>(
        JSON.parse(api.storage.get("downUrls") ?? `[]`),
      );
      const currentDownUrls = new Set<string>();

      await Promise.all(
        urls.map(async (url) => {
          const res = await api.fetch(url);
          if (!res.ok) {
            currentDownUrls.add(url);
            if (!previousDownUrls.has(url)) {
              api.emit([
                {
                  id: `${url}-${Date.now()}`,
                  title: `Failed to fetch ${url}`,
                  subtitle: `HTTP ${res.status}, error: ${res.error || "unknown"}`,
                  url,
                  timestamp: Date.now(),
                },
              ]);
            }
          }
        }),
      );

      // Store the current down URLs for the next refresh
      api.storage.set("downUrls", JSON.stringify(Array.from(currentDownUrls)));
    },
  };
};
