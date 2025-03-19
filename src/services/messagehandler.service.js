import { logger } from "../utils/logger.js";

export class MessageHandlerService {
  constructor(bot, groqService, telegramBot) {
    this.bot = bot;
    this.groqService = groqService;
    this.telegramBotService = telegramBot;
  }
  onMessage() {
    this.bot.on("message", async (message) => {
      const { chat, text, photo } = message;
      const chatId = chat.id;

      if (text && text.startsWith("/")) {
        return; // Let command handler deal with it
      }
      // Text messages
      else if (text) {
        await this.handleTextMessage(chatId, text);
      }
      // Photo messages
      else if (photo && photo.length > 0) {
        await this.handleImageToTextMessage(chatId, photo);
      }
    });
  }

  async handleTextMessage(chatId, text) {
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
        this.bot.sendMessage(chatId, "Sorry, I couldn't process your request.");
      }
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
      this.bot.sendMessage(
        chatId,
        "An error occurred while processing your request."
      );
    }
  }

  async handleImageToTextMessage(chatId, photo) {
    logger.log("Handling image message");
    const file = await this.bot.getFile(photo[photo.length - 1].file_id);
    const filePath = file.file_path;

    logger.log(`File path: ${filePath}`);
    const fileExtension = filePath.split(".").pop().toLowerCase();
    logger.log(`File extension: ${fileExtension}`);
    const allowedExtensions = ["jpg", "jpeg", "png"];

    if (!allowedExtensions.includes(fileExtension)) {
      this.bot.sendMessage(
        chatId,
        "Please upload a valid image file  (jpg, jpeg, png)."
      );
      return;
    }

    try {
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      logger.log(`File URL: ${fileUrl}`);
      const response = await this.groqService.visionComplete(
        fileUrl,
        this.telegramBotService.chatHistory
      );
      logger.log("Processed image response:", response);
      const botReply =
        response.choices?.[0]?.message?.content ||
        "I couldn't analyze the image.";

      this.bot.sendMessage(chatId, botReply);
      this.telegramBotService.addMessageToChatHistory(botReply, "system");
    } catch (error) {
      logger.error(`Error processing image: ${error.message}`);
      this.bot.sendMessage(
        chatId,
        "An error occurred while processing your image."
      );
    }
  }
}
