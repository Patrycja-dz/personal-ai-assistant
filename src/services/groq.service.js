import Groq from "groq-sdk";
import { IModelService } from "./model.service.js";
import {
  CHAT_MAX_COMPLETION_TOKENS,
  CHAT_MODEL,
  CHAT_TEMPERATURE,
} from "../config/config.js";

export class GroqService extends IModelService {
  constructor(apiKey) {
    super();
    if (!apiKey) {
      logger.error("Groq API key is not set in .env file");
      throw new Error("Groq API key is not set in .env file");
    }
    this.groq = new Groq({ apiKey });
  }

  async getGroqChatCompletion(text) {
    if (!text) {
      logger.error("Text for chat completion is missing");
      throw new Error("Text for chat completion is missing");
    }
    const response = await this.groq.chat.completions.create({
      messages: [
        { role: "system", content: "you are a helpful assistant." },
        {
          role: "user",
          content: text,
        },
      ],
      model: CHAT_MODEL,
      temperature: CHAT_TEMPERATURE,
      max_completion_tokens: CHAT_MAX_COMPLETION_TOKENS,
      top_p: CHAT_TOP_P,
    });

    return response;
  }
}
