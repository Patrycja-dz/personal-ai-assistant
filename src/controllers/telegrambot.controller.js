import { TelegramBotService } from "../services/telegrambot.service.js";
import { TELEGRAM_BOT_TOKEN } from "../config/config.js";

export const telegramBot = new TelegramBotService(TELEGRAM_BOT_TOKEN);
