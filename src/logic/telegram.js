const telegraf = require('telegraf');
const config = require('../../config/index.js');

const { Message } = require('../helpers/telegram.js');
const { Action } = require('../helpers/telegram.js');

const { Telegraf, session } = telegraf;
const bot = new Telegraf(config.BOT_TOKEN);
bot.use(session());

bot.start(async ctx => Helper.onStart(ctx));

bot.command('message', async ctx => {
  if (ctx.from.id.toString() === config.ADMIN_ID) {
    ctx.session = ctx.session || {}
    ctx.session.action = 'message'

    await Message.onMessage(ctx);
  } else {
    await Message.onDefault(ctx);
  }
});

bot.on('message', async (ctx) => {
  const message = ctx.update.message.text
  ctx.session = ctx.session || {}
  const action = ctx.session.action

  if (action) {
    if (message === '❌ Отменить действие') {
      return await Message.onCancel(ctx);
    }

    switch (action) {
      case 'new':
        await Action.onNew(ctx);
        break;

      case 'message':
        await Action.onMessage(ctx);
        break;
    }
  } else {
    switch (message) {
      case '▶️ Создать запрос':
        await Message.onNew(ctx);
        break;

      case '🧨 Удалить запрос':
        await Message.onDelete(ctx);
        break;

      case '⭐️ Мои запросы':
        await Message.onList(ctx);
        break;

      default:
        await Message.onDefault(ctx);
    }
  }
})

async function startup() {
  await bot.launch();
  console.log(new Date(), 'Bot started as', bot.botInfo.username);
}

startup();

module.exports = bot;