const cheerio = require('cheerio');
const got = require('got');

const Service = {
  async getListByString(queryString, count = 40) {
    let result = [];
    const vgmUrl= `https://www.kufar.by/listings?ot=1&query=${queryString}`;

    await got(vgmUrl).then(response => {
      const $ = cheerio.load(response.body);
      const listingsData = $('div[data-name=listings] article > div');
      const list = [...listingsData][0].children.slice(0, count);

      const selectors = {
        date: 'a > div:first-child span',
        title: 'a > div:nth-child(2) h3',
        price: 'a > div:nth-child(2) > div:nth-child(2) > div:first-child',
        place: 'a > div:nth-child(2) > div:nth-child(2) span:nth-child(2)',
      };

      const arr = list.map(child => {
        const $ = cheerio.load(child);
        const link = child.attribs.href;

        return {
          link,
          id: link.replace('https://www.kufar.by/item/', ''),
          date: $(selectors.date).text(),
          title: $(selectors.title).text(),
          price: $(selectors.price).text(),
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
}

module.exports = Service;