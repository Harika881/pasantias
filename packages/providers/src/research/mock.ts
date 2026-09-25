// FILE: packages/providers/src/research/mock.ts
import { ResearchProvider } from "../interfaces";
export class MockResearchProvider implements ResearchProvider {
  name = "mock";
  async research(topic: string) {
    return {
      summary: `No live research provider configured. Placeholder context for "${topic}". Configure TAVILY_API_KEY for real research.`,
      sources: [],
    };
  }
}