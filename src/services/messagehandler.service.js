import { logger } from "../utils/logger.js";

export class MessageHandlerService {
  constructor(bot, groqService, telegramBot) {
    this.bot = bot;
    this.groqService = groqService;
    this.telegramBotService = telegramBot;
  }
  onMessage() {
    this.bot.on("message", async (message) => {
      const { chat, text } = message;
      const chatId = chat.id;

      if (!text || text.startsWith("/")) {
        return;
      }

      logger.log(`Received message: ${text}`);
      try {
        const response = await this.groqService.getGroqChatCompletion(
          text,
          this.telegramBotService.chatHistory
        );
        const botReply = response.choices?.[0]?.message?.content;
        if (response.choices?.[0]?.message?.content) {
          logger.log(response.choices[0]);
          this.bot.sendMessage(chatId, response.choices[0].message.content);
          this.telegramBotService.addMessageToChatHistory(text, "user");
          this.telegramBotService.addMessageToChatHistory(botReply, "system");
        } else {
          this.bot.sendMessage(
            chatId,
            "Sorry, I couldn't process your request."
          );
        }
      } catch (error) {
        logger.error(`Error processing message: ${error.message}`);
        this.bot.sendMessage(
          chatId,
          "An error occurred while processing your request."
        );
      }
    });
  }
}
