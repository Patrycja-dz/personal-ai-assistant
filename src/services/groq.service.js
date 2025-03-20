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
        content: text,
      },
    ];

    const response = await this.groq.chat.completions.create({
      messages: messages,
      model: CHAT_MODEL,
      temperature: CHAT_TEMPERATURE,
      max_completion_tokens: CHAT_MAX_COMPLETION_TOKENS,
      top_p: CHAT_TOP_P,
    });

    return response;
  }
  async visionComplete(image_url, chatHistory) {
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
    const response = await this.groq.chat.completions.create({
      messages: messages,
      model: VISION_CHAT_MODEL,
      temperature: CHAT_TEMPERATURE,
      max_completion_tokens: CHAT_MAX_COMPLETION_TOKENS,
      top_p: CHAT_TOP_P,
    });
    logger.log("Vision API response:", response);

    return response;
  }

  async speechToText(file_id, bot) {
    try {
      const file = await bot.getFile(file_id);
      const audio_path = `${FILE_URI}${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

      const response = await axios({
        method: "get",
        url: audio_path,
        responseType: "stream",
      });

      const localPathFile = "./temp_audio.ogg";
      const writer = fs.createWriteStream(localPathFile);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const localPathFlacFile = "./temp_audio.flac";
      await new Promise((resolve, reject) => {
        ffmpeg(localPathFile)
          .output(localPathFlacFile)
          .audioCodec("flac")
          .audioFrequency(16000)
          .audioChannels(1)
          .on("end", () => {
            console.log("Konwersja OGG -> FLAC zakończona");
            resolve();
          })
          .on("error", (err) => {
            console.error("Błąd konwersji FFmpeg:", err);
            reject(err);
          })
          .run();
      });

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(localPathFlacFile),
        model: "whisper-large-v3-turbo",
        language: "pl",
        temperature: 0.0,
      });
      console.log(transcription.text);

      fs.unlinkSync(localPathFile);
      fs.unlinkSync(localPathFlacFile);

      return transcription.text;
    } catch (error) {
      logger.error(`Error processing audio: ${error.message}`);
      throw new Error("Error processing audio");
    } finally {
      if (fs.existsSync(localPathFile)) {
        fs.unlinkSync(localPathFile);
      }
      if (fs.existsSync(localPathFlacFile)) {
        fs.unlinkSync(localPathFlacFile);
      }
    }
  }
}
