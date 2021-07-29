const { Telegraf } = require('telegraf');
const config = require('../../config/index.js');

const User = require('../models/user.js');
const Request = require('../models/request');

const bot = new Telegraf(config.BOT_TOKEN);

bot.start(async ctx => {
  const userData = ctx.from;
  const user = await User.findOne({ id: userData.id });

  if (!user) {
    const small = new User({
      name: userData.first_name + ' ' + userData.last_name,
      id: userData.id,
      registrationDate: ctx.update.message.date,
      session: '',
      requests: [],
    });

    await small.save();
  }

  const paragraphs = [
    'Привет! Я помогу тебе отслеживать объявления на Куфаре',
    'Ты говоришь мне, по какому запросу делать поиск, а я уведомляю тебя о новых объявлениях по мере их появления 😇',
    'Что я умею: /menu 🤓',
  ].join('\n\n');

  ctx.reply('👋');
  setTimeout(() => ctx.reply(paragraphs), 1000);
});

bot.command('new', async ctx => {
  const request = await Request.findOne({ userId: ctx.from.id });

  if (request) {
    return ctx.reply(
      `У тебя уже есть действующий запрос: *${request.query}*\n\nТы можешь удалить его командой /delete`,
      { parse_mode: 'Markdown' }
    );
  }

  await User.updateOne({ id: ctx.from.id }, { session: '/new' });

  await ctx.reply(
    'Итак, новое отслеживание!\n\nНапиши мне строку, на основе которой я буду искать нужные объявления.\n\nПример строки: *macbook pro*',
    { parse_mode: 'Markdown' },
  );
});

bot.command('delete', async ctx => {
  const request = await Request.deleteOne({ userId: ctx.from.id });

  ctx.reply('Остановил отслеживание! 🙃\n\nТеперь можно создать новое: /new');
});

bot.command('cancel', async ctx => {
  await User.updateOne({ id: ctx.from.id }, { session: '' });

  ctx.reply('Отменил действие! Список доступных команд можно посмотреть в /menu 👀');
});

bot.command('my', async ctx => {
  const requests = await Request.find({ userId: ctx.from.id });

  ctx.reply(`Ваши запросы:\n\n${requests.map(req => req.query).join('\n')}`);
});

bot.command('message', async ctx => {
  if (ctx.from.id.toString() === config.ADMIN_ID) {
    await User.updateOne({ id: ctx.from.id }, { session: '/message' });

    ctx.reply('Итак, новое сообщение *всем* пользователям!\n\nПиши внимательно!', { parse_mode: 'Markdown' });
  } else {
    ctx.reply('У тебя не доступа к этой команде 😢');
  }
});

bot.command('menu', ctx => {
  const text =
`Команды, с которыми я умею работать 👇\n
/new — начать новое отслеживание
/delete — остановить активное отслеживание
/cancel — отменить текущее действие
`

  ctx.reply(text);
});

bot.on('message', async ctx => {
  const user = await User.findOne({ id: ctx.from.id });

  if (user && user.session === '/new') {
    const request = new Request({
      userId: user.id,
      query: ctx.update.message.text,
    });

    await request.save();
    await User.updateOne({ id: ctx.from.id }, { session: '' });

    return ctx.reply(
      `Отлично! Теперь каждый раз, когда по запросу *${request.query}* появится что-нибудь новенькое, я тебе сообщу!\n\nP.S. Проверяю раз в *3 минуты* 👀`,
      { parse_mode: 'Markdown' }
    );
  } else if (user && user.session === '/message') {
    const users = await User.find({});

    users.forEach(user => {
      try {
        bot.telegram.sendMessage(user.id, ctx.message.text, { parse_mode: 'Markdown' });
      } catch (e) {
        console.error(e);
      }
    });

    return await User.updateOne({ id: ctx.from.id }, { session: '' });
  }

  ctx.reply('Немного не понял тебя 😪\nИспользуй команды: /menu');
})

bot.launch();

module.exports = bot;