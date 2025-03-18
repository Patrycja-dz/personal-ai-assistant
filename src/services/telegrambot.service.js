import TelegramBot from "node-telegram-bot-api";
import { logger } from "../utils/logger.js";
import { MessageHandlerService } from "./messagehandler.service.js";
import { CommandHandlerService } from "./command.service.js";

export class TelegramBotService {
  constructor(token, groqService) {
    logger.warn("Telegram token is not set in .env file");
    if (!token) {
      throw new Error("Telegram token is not set in .env file");
    }
    if (!groqService) {
      logger.warn("Groq API key is not set in .env file");
      throw new Error("Groq API key is not set in .env file");
    }
    this.bot = new TelegramBot(token, { polling: true });
    this.groqService = groqService;
    this.messageService = new MessageHandlerService(
      this.bot,
      this.groqService,
      this
    );
    this.commandHandler = new CommandHandlerService(this.bot);
    this.chatHistory = [];
    this.handleSetupListeners();
  }

  handleSetupListeners() {
    this.commandHandler.onTextStart();
    this.messageService.onMessage();
    this.commandHandler.onText();
  }

  start() {
    logger.log("Telegram bot has been started");
  }

  addMessageToChatHistory(message, role) {
    this.chatHistory.push({ role, message });

    if (this.chatHistory.length > 10) {
      this.chatHistory.shift();
    }
  }
}
