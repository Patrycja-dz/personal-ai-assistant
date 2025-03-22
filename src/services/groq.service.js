import Groq from "groq-sdk";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { IModelService } from "./model.service.js";
import {
  CHAT_MAX_COMPLETION_TOKENS,
  CHAT_MODEL,
  CHAT_TEMPERATURE,
  CHAT_TOP_P,
  FILE_URI,
  VISION_CHAT_MODEL,
} from "../config/config.js";
import { logger } from "../utils/logger.js";
import { chatCompletitionPrompt } from "../prompts/chat-completition.js";
import fs from "fs";

export class GroqService extends IModelService {
  constructor(apiKey) {
    super();
    if (!apiKey) {
      logger.error("Groq API key is not set in .env file");
      throw new Error("Groq API key is not set in .env file");
    }
    this.groq = new Groq({ apiKey });
  }

  async getGroqChatCompletion(text, chatHistory) {
    if (!text) {
      logger.error("Text for chat completion is missing");
      throw new Error("Text for chat completion is missing");
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "search_web",
          description:
            "Wyszukuje aktualne informacje w internecie za pomocą Tavily API",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Zapytanie do wyszukiwarki",
              },
            },
            required: ["query"],
          },
        },
      },
    ];

    const mappedHistory = chatHistory.map((msg) => {
      const messageContent = msg.content || msg.message;

      if (msg.role === "function") {
        return {
          role: "function",
          name: msg.name || "search_web",
          content: messageContent,
        };
      }

      return {
        role: msg.role === "system" ? "assistant" : msg.role,
        content: messageContent,
      };
    });

    const messages = [
      { role: "system", content: chatCompletitionPrompt },
      ...mappedHistory,
      { role: "user", content: text },
    ];

    logger.log("Sending messages to Groq:", JSON.stringify(messages));

    try {
      const response = await this.groq.chat.completions.create({
        messages: messages,
        model: CHAT_MODEL,
        temperature: CHAT_TEMPERATURE,
        max_tokens: CHAT_MAX_COMPLETION_TOKENS,
        top_p: CHAT_TOP_P,
        tools: tools,
        tool_choice: "auto",
      });

      return response;
    } catch (error) {
      logger.error(`Error in Groq chat completion: ${error.message}`);
      logger.error(error.stack);
      throw new Error(`Chat completion API error: ${error.message}`);
    }
  }

  async visionComplete(image_url, chatHistory) {
    if (!image_url) {
      logger.error("Image URL is missing");
      throw new Error("Image URL is missing");
    }
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant. Reply in the same language as the user.",
      },
      ...chatHistory.map((message) => ({
        role: message.role,
        content: message.message,
      })),
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Co znajduje się na tym obrazku?",
          },
          {
            type: "image_url",
            image_url: {
              url: image_url,
            },
          },
        ],
      },
    ];
    try {
      const response = await this.groq.chat.completions.create({
        messages: messages,
        model: VISION_CHAT_MODEL,
        temperature: CHAT_TEMPERATURE,
        max_completion_tokens: CHAT_MAX_COMPLETION_TOKENS,
        top_p: CHAT_TOP_P,
      });

      logger.log("Vision API response:", response);

      return response;
    } catch (error) {
      logger.error(`Error in Vision API: ${error.message}`);
      throw new Error("Vision API error");
    }
  }

  async speechToText(file_id, bot) {
    let localPathFile, localPathFlacFile;

    try {
      const file = await bot.getFile(file_id);
      const audio_path = `${FILE_URI}${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      const response = await axios.get(audio_path, { responseType: "stream" });
      localPathFile = "./temp_audio.ogg";
      localPathFlacFile = "./temp_audio.flac";

      const writer = fs.createWriteStream(localPathFile);
      response.data.pipe(writer);
      await new Promise((resolve, reject) =>
        writer.on("finish", resolve).on("error", reject)
      );

      await new Promise((resolve, reject) => {
        ffmpeg(localPathFile)
          .output(localPathFlacFile)
          .audioCodec("flac")
          .audioFrequency(16000)
          .audioChannels(1)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(localPathFlacFile),
        model: "whisper-large-v3-turbo",
        language: "pl",
        temperature: 0.0,
      });

      console.log(transcription.text);
      return transcription.text;
    } catch (error) {
      logger.error(`Error processing audio: ${error.message}`);
      throw new Error("Error processing audio");
    } finally {
      if (localPathFile)
        await fs.promises.unlink(localPathFile).catch(() => {});
      if (localPathFlacFile)
        await fs.promises.unlink(localPathFlacFile).catch(() => {});
    }
  }

  async getGroqChatCompletionWithoutTools(text, chatHistory) {
    const mappedHistory = chatHistory.map((msg) => {
      const messageContent = msg.content || msg.message;

      if (msg.role === "function") {
        return {
          role: "function",
          name: msg.name || "search_web",
          content: messageContent,
        };
      }

      return {
        role: msg.role === "system" ? "assistant" : msg.role,
        content: messageContent,
      };
    });

    const messages = [
      { role: "system", content: chatCompletitionPrompt },
      ...mappedHistory,
      { role: "user", content: text },
    ];

    logger.log(
      "Sending messages to Groq (without tools):",
      JSON.stringify(messages)
    );

    try {
      const response = await this.groq.chat.completions.create({
        messages: messages,
        model: CHAT_MODEL,
        temperature: CHAT_TEMPERATURE,
        max_tokens: CHAT_MAX_COMPLETION_TOKENS,
        top_p: CHAT_TOP_P,
        tool_choice: "none",
      });

      return response;
    } catch (error) {
      logger.error(`Error in Groq chat completion: ${error.message}`);
      logger.error(error.stack);
      throw new Error(`Chat completion API error: ${error.message}`);
    }
  }
}
