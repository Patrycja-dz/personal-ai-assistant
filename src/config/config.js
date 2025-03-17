import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const CHAT_MODEL = process.env.CHAT_MODEL || "llama-3.3-70b-versatile";
export const CHAT_TEMPERATURE = process.env.CHAT_TEMPERATURE || 0.5;
export const CHAT_MAX_COMPLETION_TOKENS =
  process.env.CHAT_MAX_COMPLETION_TOKENS || 1024;
export const CHAT_TOP_P = process.env.CHAT_TOP_P || 1;
