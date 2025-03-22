import { tavily } from "@tavily/core";
import { logger } from "../utils/logger.js";

export class Tavily {
  constructor(apKey) {
    if (!apKey) {
      throw new Error("Tavily token is not set in .env file");
    }

    this.tvly = tavily({ apiKey: apKey });
  }

  async search(query) {
    try {
      const response = await this.tvly.search(query, {
        searchDepth: "advanced",
        includeImages: false,
        includeAnswer: true,
        maxResults: 5,
      });

      if (response.answer && response.results.length > 0) {
        const sources = response.results
          .map((res, index) => `${index + 1}. ${res.title} - ${res.url}`)
          .join("\n");

        return `${response.answer}\n\n📌 Źródła:\n${sources}`;
      } else if (response.answer) {
        return response.answer;
      } else {
        return "Nie znaleziono wystarczających informacji w wyszukiwarce Tavily.";
      }
    } catch (error) {
      logger.error(`Error searching for query: ${error.message}`);
      throw new Error(
        `Error searching for query: ${error.message}, Failed to perform internet search`
      );
    }
  }
}
