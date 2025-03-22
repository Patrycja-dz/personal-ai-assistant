import { TelegramBotService } from "../services/telegrambot.service.js";
import {
  TELEGRAM_BOT_TOKEN,
  GROQ_API_KEY,
  TAVILY_API_KEY,
} from "../config/config.js";
import { GroqService } from "../services/groq.service.js";
import { Tavily } from "../services/tavily.service.js";

const groqService = new GroqService(GROQ_API_KEY);
const tavily = new Tavily(TAVILY_API_KEY);

export const telegramBot = new TelegramBotService(
  TELEGRAM_BOT_TOKEN,
  groqService,
  tavily
);
