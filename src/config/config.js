import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
