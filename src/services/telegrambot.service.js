import TelegramBot from "node-telegram-bot-api";
import { logger } from "../utils/logger.js";
import { MessageHandlerService } from "./messagehandler.service.js";
import { CommandHandlerService } from "./command.service.js";

export class TelegramBotService {
  constructor(token, groqService) {
    if (!token) {
      throw new Error("Telegram token is not set in .env file");
    }
    if (!groqService) {
      throw new Error("Groq API key is not set in .env file");
    }
    this.bot = new TelegramBot(token, { polling: true });
    this.groqService = groqService;
    this.messageService = new MessageHandlerService(this.bot, this.groqService);
    this.commandHandler = new CommandHandlerService(this.bot);
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
}
