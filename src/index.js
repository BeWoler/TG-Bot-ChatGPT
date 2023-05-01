import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { ogg } from "./helpers/oggConverter.js";
import { openai } from "./openai.js";
import { code } from "telegraf/format";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.on(message("voice"), async (ctx) => {
  try {
    await ctx.reply(code("Принял, жду ответа :)"));

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);

    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);

    if (!text) {
      ctx.reply("Извините, что-то пошло не так... ;(");
      return;
    }

    await ctx.reply(code(`Твой запрос: ${text}`));

    const messages = [{ role: openai.roles.USER, content: text }];
    const response = await openai.chat(messages);

    await ctx.reply(response.content);
  } catch (e) {
    console.log("Error with bot", e.message);
  }
});

bot.command("start", async (ctx) => {
  await ctx.reply(
    `Окей ${ctx.from.first_name}, теперь ты можешь пообщаться :)`
  );
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
