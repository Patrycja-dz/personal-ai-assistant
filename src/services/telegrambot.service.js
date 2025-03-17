import TelegramBot from "node-telegram-bot-api";
import { logger } from "../utils/logger.js";

export class TelegramBotService {
  constructor(token) {
    if (!token) {
      throw new Error("Telegram token is not set in .env file");
    }
    this.bot = new TelegramBot(token, { polling: true });
    this.handleSetupListeners();
  }

  handleSetupListeners() {
    this.onTextStart();
    this.onMessage();
    this.onText();
  }

  onTextStart() {
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(
        msg.chat.id,
        "Hello! I am your Telegram bot. How can I help you today?"
      );
    });
  }

  onMessage() {
    this.bot.on("message", (message) => {
      const { chat, text } = message;
      const chatId = chat.id;

      logger.log(`Received message: ${text}`);
      this.bot.sendMessage(
        chatId,
        ` 'Received your message, you said: ${text}`
      );
    });
  }

  onText() {
    this.bot.onText(/\/echo (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const response = match[1];

      this.bot.sendMessage(chatId, `Echo: ${response}`);
    });
  }

  start() {
    logger.log("Telegram bot has been started");
  }
}
