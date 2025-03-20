import { FILE_URI } from "../config/config.js";
import { logger } from "../utils/logger.js";

export class MessageHandlerService {
  constructor(bot, groqService, telegramBot) {
    this.bot = bot;
    this.groqService = groqService;
    this.telegramBotService = telegramBot;
  }
  onMessage() {
    this.bot.on("message", async (message) => {
      const { chat, text, photo, voice } = message;
      const chatId = chat.id;

      if (text && text.startsWith("/")) {
        return;
      } else if (text) {
        await this.handleTextMessage(chatId, text);
      } else if (voice) {
        await this.handleVoiceMessage(chatId, voice);
      } else if (photo && photo.length > 0) {
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
      const fileUrl = `${FILE_URI}${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
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
  async handleVoiceMessage(chatId, voice) {
    try {
      logger.log("Handling voice message");
      const response = await this.groqService.speechToText(
        voice.file_id,
        this.bot
      );
      const text = response;
      logger.log(`Voice message text: ${text}`);
      this.bot.sendMessage(chatId, text);
    } catch (error) {
      logger.error(`Error processing voice message: ${error.message}`);
      this.bot.sendMessage(
        chatId,
        "An error occurred while processing your voice message."
      );
    }
  }
}
