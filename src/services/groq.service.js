import Groq from "groq-sdk";
import { IModelService } from "./model.service.js";

export class GroqService extends IModelService {
  constructor(apiKey) {
    super();
    if (!apiKey) {
      throw new Error("Groq API key is not set in .env file");
    }
    this.groq = new Groq({ apiKey });
  }

  async getGroqChatCompletion(text) {
    if (!text) {
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
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 1,
    });

    return response;
  }
}
