const User = require('../models/user.js');
const Request = require('../models/request');
const bot = require('../logic/telegram.js');

const MENU_OPTIONS = {
  parse_mode: 'Markdown',
  reply_markup: {
    resize_keyboard: true,
    keyboard: [
      ['▶️ Создать запрос'],
      ['🧨 Удалить запрос', '⭐️ Мои запросы'],
    ],
  }
}

const CANCEL_OPTIONS = {
  parse_mode: 'Markdown',
  reply_markup: {
    resize_keyboard: true,
    keyboard: [['❌ Отменить действие']],
  }
}

const Message = {
  async onStart(ctx) {
    const userData = ctx.from;
    const user = await User.findOne({ id: userData.id });

    if (!user) {
      const small = new User({
        name: userData.first_name + ' ' + userData.last_name,
        id: userData.id,
        registrationDate: ctx.update.message.date,
        requests: [],
      });

      await small.save();
    }

    const paragraphs = [
      'Привет! Я помогу тебе отслеживать объявления на Куфаре',
      'Ты говоришь мне, по какому запросу делать поиск, а я уведомляю тебя о новых объявлениях по мере их появления 😇',
    ].join('\n\n');

    ctx.reply('👋');
    setTimeout(() => ctx.reply(paragraphs, MENU_OPTIONS), 1000);
  },

  async onCancel(ctx) {
    ctx.session.action = ''
    ctx.reply('Отменил действие! 👀', MENU_OPTIONS);
  },

  async onNew(ctx) {
    const request = await Request.findOne({ userId: ctx.from.id });

    if (request) {
      const message = `У тебя уже есть действующий запрос: *${request.query}*\n\nТы можешь удалить его`
      return ctx.reply(message, MENU_OPTIONS);
    }

    ctx.session.action = 'new'

    await ctx.reply(
      'Итак, новое отслеживание!\n\nНапиши мне строку, на основе которой я буду искать нужные объявления.\n\nПример строки: *macbook pro*',
      CANCEL_OPTIONS,
    );
  },

  async onDelete(ctx) {
    await Request.deleteOne({ userId: ctx.from.id });

    ctx.reply('Остановил отслеживание! 🙃 Теперь можно создать новое', MENU_OPTIONS);
  },

  async onList(ctx) {
    const requests = await Request.find({ userId: ctx.from.id });

    if (requests.length) {
      ctx.reply(`Твои текущие запросы:\n\n${requests.map(req => `• ${req.query}`).join('\n')}`, MENU_OPTIONS);
    } else {
      ctx.reply('У тебя пока что нет запросов! 🧘‍')
    }
  },

  async onMessage(ctx) {
    ctx.reply('Итак, новое сообщение *всем* пользователям!\n\nПиши внимательно!', CANCEL_OPTIONS);
  },

  async onDefault(ctx) {
    ctx.reply('Немного не понял тебя 😪\nИспользуй команды: /menu', MENU_OPTIONS);
  },
}

const Action = {
  async onNew(ctx) {
    const user = await User.findOne({ id: ctx.from.id });

    const request = new Request({
      userId: user.id,
      query: ctx.update.message.text,
    });

    await request.save();
    ctx.session.action = ''

    return ctx.reply(
      `Отлично! Теперь каждый раз, когда по запросу *${request.query}* появится что-нибудь новенькое, я тебе сообщу!\n\nP.S. Проверяю раз в *3 минуты* 👀`,
      MENU_OPTIONS,
    );
  },

  async onMessage(ctx) {
    const users = await User.find({});

    users.forEach(user => {
      try {
        bot.telegram.sendMessage(user.id, ctx.message.text, MENU_OPTIONS);
      } catch (e) {
        console.error(e);
      }
    });

    ctx.session.action = ''

    return;
  },
}

module.exports.Action = Action;
module.exports.Message = Message;