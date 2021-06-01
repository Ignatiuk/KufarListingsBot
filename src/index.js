const Slimbot = require('slimbot');
const bot = new Slimbot('1701941027:AAHCUlRmJaaUsWh6tawYDQhbGbzUKKyntTw');

bot.on('message', message => {
  bot.sendMessage(message.chat.id, 'Привет!');
});

bot.startPolling();
