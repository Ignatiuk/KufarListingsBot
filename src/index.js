const { Telegraf } = require('telegraf')
const { CronJob } = require('cron');
const config = require('../config/index.js');

const bot = new Telegraf(config.BOT_KEY);
const KufarService = require('./helpers/kufar.js');

let previousListing = {};

async function parse() {
  const listings = await KufarService.getListByString('macbook');
  const newListings = [];

  if (previousListing.title) {
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
  
      if (
        listing.id !== previousListing.id &&
        !listing.title.toLowerCase().includes('куплю')
      ) {
        newListings.push(listing);
      } else {
        break;
      }
    }
  }

  if (newListings.length) {
    newListings.reverse().forEach(listing => {
      const caption = `${listing.title}\n${listing.price}\n${listing.place}\n\n${listing.link}`;
  
      bot.telegram.sendPhoto(
        config.CHANNEL_ID,
        listing.image,
        { caption },
      );
    });
  }

  previousListing = listings[0];
}

const job = new CronJob(
  '*/5 * * * *',
  async () => await parse(),
  null,
  true,
  'Europe/Minsk',
);

job.start();
bot.launch();
