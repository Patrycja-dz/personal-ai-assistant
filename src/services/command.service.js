export class CommandHandlerService {
  constructor(bot) {
    this.bot = bot;
  }
  onTextStart() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage =
        `Hello ${msg.chat.first_name}! I am your Buddy Telegram bot. How can I help you today? Here are some things I can do:\n\n` +
        "💬 Conversation\n" +
        "- Answer questions\n" +
        "- Engage in conversations on various topics\n" +
        "- Explain complex concepts\n\n" +
        "🔍 Search\n" +
        "- Find current information on the internet\n" +
        "- Check current events\n" +
        "- Find facts and data\n\n" +
        "👁️ Image Analysis\n" +
        "- Describe the content of photos\n" +
        "- Analyze submitted images\n" +
        "- Explain what I see in photos\n\n" +
        "🎤 Voice Messages\n" +
        "- Understand and respond to voice messages\n" +
        "- Transcribe audio to text\n\n" +
        "💭 Context\n" +
        "- Remember our conversation\n" +
        "- Refer to previous messages\n\n" +
        "Just write to me or send a voice message/photo, and I will try to help! 😊";
      this.bot.sendMessage(chatId, welcomeMessage);
    });
  }

  onText() {
    this.bot.onText(/\/echo (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const response = match[1];

      this.bot.sendMessage(chatId, `Echo: ${response}`);
    });
  }
}
