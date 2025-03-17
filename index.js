import express from "express";
import { telegramBot } from "./src/controllers/telegrambot.controller.js";
import { logger } from "./src/utils/logger.js";
import { PORT } from "./src/config/config.js";
const app = express();

app.listen(PORT, () => {
  logger.log(`Server is running on port http://localhost:${PORT}`);
  telegramBot.start();
});
