import express from 'express';
import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { ogg } from "./helpers/oggConverter.js";
import { openai } from "./openai.js";
import { code } from "telegraf/format";

const app = express();

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

const INITIAL_SESSION = {
  messages: [],
};

bot.command("new", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.reply("Жду голосовое или текстовое сообщение :)");
});

bot.command("start", async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.reply(
    `Окей ${ctx.from.first_name}, жду голосовое или текстовое сообщение :)`
  );
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
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

    ctx.session.messages.push({ role: openai.roles.USER, content: text });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (e) {
    ctx.reply('Сорри, ошибка, обратитесь к разрабу ;(');
    console.log("Error with bot", e.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("Принял, жду ответа :)"));

    await ctx.reply(code(`Твой запрос: ${ctx.message.text}`));

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content ? response.content : 'Сорри, ошибка');
  } catch (e) {
    ctx.reply('Сорри, ошибка, обратитесь к разрабу ;(');
    console.log("Error with bot", e.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
