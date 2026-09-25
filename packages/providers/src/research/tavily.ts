// FILE: packages/providers/src/research/tavily.ts
import axios from "axios";
import { ResearchProvider } from "../interfaces";
import { withRetry } from "@studio/shared";

export class TavilyResearchProvider implements ResearchProvider {
  name = "tavily";
  async research(topic: string) {
    return withRetry(async () => {
      const { data } = await axios.post("https://api.tavily.com/search", {
        api_key: process.env.TAVILY_API_KEY, query: topic, max_results: 5, search_depth: "advanced",
      }, { timeout: 20000 });
      return {
        summary: data.answer || data.results?.map((r: any) => r.content).join("\n").slice(0, 2000) || "",
        sources: (data.results || []).map((r: any) => ({ title: r.title, url: r.url })),
      };
    }, { retries: 2, timeoutMs: 25000 });
  }
}