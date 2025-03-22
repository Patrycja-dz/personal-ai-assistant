import { FILE_URI } from "../config/config.js";
import { logger } from "../utils/logger.js";

export class MessageHandlerService {
  constructor(bot, groqService, telegramBot, tavily) {
    this.bot = bot;
    this.groqService = groqService;
    this.telegramBotService = telegramBot;
    this.tavily = tavily;
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

    const waitingMessage = await this.bot.sendMessage(chatId, "Przetwarzam...");

    try {
      const response = await this.groqService.getGroqChatCompletion(
        text,
        this.telegramBotService.chatHistory
      );

      if (response.choices?.[0]?.message?.tool_calls?.length) {
        logger.log(
          "Tool call detected in response:",
          JSON.stringify(response.choices[0].message.tool_calls)
        );

        const toolCall = response.choices[0].message.tool_calls[0];
        let args;

        try {
          args =
            typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
        } catch (e) {
          logger.error(`Error parsing tool args: ${e.message}`);
          await this.bot.editMessageText(
            "Wystąpił błąd podczas analizy argumentów zapytania.",
            { chat_id: chatId, message_id: waitingMessage.message_id }
          );
          return;
        }

        if (toolCall.function.name === "search_web") {
          if (!args.query) {
            logger.error("No query parameter in search_web function call");
            await this.bot.editMessageText(
              "Nie znaleziono parametru zapytania.",
              { chat_id: chatId, message_id: waitingMessage.message_id }
            );
            return;
          }

          const query = args.query;
          await this.bot.editMessageText(`Szukam informacji o: "${query}"...`, {
            chat_id: chatId,
            message_id: waitingMessage.message_id,
          });

          try {
            const searchResults = await this.tavily.search(query);
            logger.log("Search results:", JSON.stringify(searchResults));

            const toolResponseMessage = {
              role: "function",
              name: "search_web",
              content: JSON.stringify(searchResults),
            };

            const assistantMessage = {
              role: "assistant",
              content: response.choices[0].message.content || "",
              tool_calls: response.choices[0].message.tool_calls,
            };

            const additionalMessages = [
              { role: "user", content: text },

              {
                role: "assistant",
                message: JSON.stringify({
                  content: assistantMessage.content,
                  tool_calls: assistantMessage.tool_calls,
                }),
              },

              {
                role: "function",
                message: toolResponseMessage.content,
                name: "search_web",
              },
            ];

            const updatedHistory = [
              ...this.telegramBotService.chatHistory,
              ...additionalMessages,
            ];

            const finalResponse =
              await this.groqService.getGroqChatCompletionWithoutTools(
                "Oto wyniki wyszukiwania. Stwórz odpowiedź dla użytkownika na podstawie tych danych bez użycia funkcji wyszukiwania:",
                updatedHistory
              );

            logger.log("Final response:", JSON.stringify(finalResponse));

            const finalReply = finalResponse.choices[0]?.message?.content;
            if (finalReply) {
              await this.bot.editMessageText(finalReply, {
                chat_id: chatId,
                message_id: waitingMessage.message_id,
              });

              // Aktualizuj historię czatu
              this.telegramBotService.addMessageToChatHistory(text, "user");
              this.telegramBotService.addMessageToChatHistory(
                finalReply,
                "assistant"
              );
            } else {
              await this.bot.editMessageText(
                "Nie udało się wygenerować odpowiedzi na podstawie wyników wyszukiwania.",
                { chat_id: chatId, message_id: waitingMessage.message_id }
              );
            }
          } catch (error) {
            logger.error(`Error in web search process: ${error.message}`);
            await this.bot.editMessageText(
              "Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie później.",
              { chat_id: chatId, message_id: waitingMessage.message_id }
            );
          }
        } else {
          await this.bot.editMessageText(
            `Nieznana funkcja narzędziowa: ${toolCall.function.name}`,
            { chat_id: chatId, message_id: waitingMessage.message_id }
          );
        }
      } else {
        const botReply = response.choices?.[0]?.message?.content;
        if (botReply) {
          await this.bot.editMessageText(botReply, {
            chat_id: chatId,
            message_id: waitingMessage.message_id,
          });

          this.telegramBotService.addMessageToChatHistory(text, "user");
          this.telegramBotService.addMessageToChatHistory(
            botReply,
            "assistant"
          );
        } else {
          await this.bot.editMessageText(
            "Przepraszam, nie udało mi się wygenerować odpowiedzi.",
            { chat_id: chatId, message_id: waitingMessage.message_id }
          );
        }
      }
    } catch (error) {
      logger.error(`Error in text message processing: ${error.message}`);
      logger.error(error.stack);
      await this.bot.editMessageText(
        "Wystąpił błąd podczas przetwarzania wiadomości. Spróbuj ponownie później.",
        { chat_id: chatId, message_id: waitingMessage.message_id }
      );
    }
  }

  async handleVoiceMessage(chatId, voice) {
    try {
      logger.log("Handling voice message");
      const transcribedText = await this.groqService.speechToText(
        voice.file_id,
        this.bot
      );

      this.bot.sendMessage(chatId, `Rozpoznałem: "${transcribedText}"`);

      this.telegramBotService.addMessageToChatHistory(transcribedText, "user");

      await this.handleTextMessage(chatId, transcribedText);
    } catch (error) {
      logger.error(`Error processing voice message: ${error.message}`);
      this.bot.sendMessage(
        chatId,
        "An error occurred while processing your voice message."
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
        "Please upload a valid image file (jpg, jpeg, png)."
      );
      return;
    }

    try {
      const fileUrl = `${FILE_URI}${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      logger.log(`File URL: ${fileUrl}`);

      this.telegramBotService.addMessageToChatHistory(
        "Przesłano obraz do analizy",
        "user"
      );

      const response = await this.groqService.visionComplete(
        fileUrl,
        this.telegramBotService.chatHistory
      );

      logger.log("Processed image response:", response);
      const botReply =
        response.choices?.[0]?.message?.content ||
        "I couldn't analyze the image.";

      this.bot.sendMessage(chatId, botReply);
      this.telegramBotService.addMessageToChatHistory(botReply, "assistant");
    } catch (error) {
      logger.error(`Error processing image: ${error.message}`);
      this.bot.sendMessage(
        chatId,
        "An error occurred while processing your image."
      );
    }
  }
}
