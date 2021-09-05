const cheerio = require('cheerio');
const got = require('got');

const { paramsToQueryString } = require('../utils/utils.js');
const LISTINGS_URL = 'https://www.kufar.by/listings?';

const Service = {
  async getListByParams(params, count = 20) {
    let result = [];
    const queryString = paramsToQueryString(params);
    const vgmUrl = LISTINGS_URL + queryString;

    await got(vgmUrl).then(async response => {
      const $ = cheerio.load(response.body);
      const listingsData = [...$('div[data-name=listings] article > div')];

      if (!listingsData.length) {
        return;
      }

      const list = listingsData[0].children.slice(0, count);

      const selectors = {
        date: 'a > div:first-child span',
        title: 'a > div:nth-child(2) h3',
        price: 'a > div:nth-child(2) > div:nth-child(2) > div:first-child',
        place: 'a > div:nth-child(2) > div:nth-child(2) span:nth-child(2)',
      };

      const arr = list.map(child => {
        const $ = cheerio.load(child);
        const link = child.attribs.href;
        let price = $(selectors.price).text();

        if (price.includes('р.')) {
          price = price.replace(' р.', '').split(' ').join('');
        }

        return {
          link,
          id: link.replace('https://www.kufar.by/item/', ''),
          date: $(selectors.date).text(),
          title: $(selectors.title).text(),
          price: price + ' рублей',
          place: $(selectors.place).text(),
          image: child.children[0].children[0].attribs['data-src'],
        };
      });

      result = arr;
    }).catch(err => {
      console.log(err);
    });

    return result;
  },

  async getListingPhotos(listingUrl) {
    let result = [];

    await got(listingUrl).then(response => {
      const $ = cheerio.load(response.body);
      const photosData = $('.swiper-wrapper')[1].children;

      const photos = photosData.map(child => {
        const photoData = child.children[0].children[0];

        return photoData.attribs.src;
      })

      result = photos
    });

    return result;
  },
}

module.exports = Service;