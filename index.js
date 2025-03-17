import dotenv from "dotenv";
import express from "express";
import { TelegramBotService } from "./src/services/telegrambot.service.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const telegramBot = new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  telegramBot.start();
});
