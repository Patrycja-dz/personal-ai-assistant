import { logger } from "../utils/logger.js";

export class MessageHandlerService {
  constructor(bot, groqService) {
    this.bot = bot;
    this.groqService = groqService;
  }
  onMessage() {
    this.bot.on("message", async (message) => {
      const { chat, text } = message;
      const chatId = chat.id;

      if (!text) {
        this.bot.sendMessage(chatId, "Sorry, I only process text messages.");
        return;
      }
      logger.log(`Received message: ${text}`);
      try {
        const response = await this.groqService.getGroqChatCompletion(text);

        if (response.choices?.[0]?.message?.content) {
          this.bot.sendMessage(chatId, response.choices[0].message.content);
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
