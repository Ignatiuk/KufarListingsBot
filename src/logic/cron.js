const { CronJob } = require('cron');
const bot = require('./telegram.js');

const KufarService = require('../helpers/kufar.js');
const Request = require('../models/request.js');

async function parse({ query, userId, lastListing }) {
  const listings = await KufarService.getListByParams({ query, onlyInTitles: true }, 10);
  const newListings = [];

  if (lastListing) {
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
  
      if (
        listing.id !== lastListing.id
        && !listing.title.toLowerCase().includes('куплю')
      ) {
        newListings.push(listing);
      } else {
        break;
      }
    }
  } else {
    newListings.push(listings[0]);
  }

  if (newListings[0]) {
    for (const listing of newListings.reverse()) {
      try {
        const caption = `*${listing.title}*\n\n${listing.price}\n${listing.place}\n\n${listing.link}`;
        const photos = await KufarService.getListingPhotos(listing.link);

        const media = photos.slice(0, 10).map((photoUrl, i) => ({
          type: 'photo',
          media: { url: photoUrl },
          caption: i === 0 ? caption : '',
          parse_mode: 'Markdown',
        }));

        await bot.telegram.sendMediaGroup(userId, media);
      } catch (e) {
        const desc = e.response?.description || ''

        if (
          desc.includes('bot was blocked by the user') ||
          desc.includes('chat not found')
        ) {
          await Request.deleteOne({ userId });
        }

        console.error(e);
      }
    }
  }

  await Request.updateOne({ userId }, { lastListing: listings[0] });
}

async function checkRequests() {
  const requests = await Request.find({});

  if (!requests.length) {
    return;
  }

  for (const request of requests) {
    await parse(request);
  }
}

const job = new CronJob(
  '*/3 * * * *',
  async () => await checkRequests(),
  null,
  true,
  'Europe/Minsk',
);

job.start();