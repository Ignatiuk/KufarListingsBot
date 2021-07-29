exports.paramsToQueryString = function(params) {
  const kufarParams = {
    onlyInTitles: 'ot',
    onlyWithPhoto: 'oph',
    onlyWithVideo: 'ovi',
    withExchange: 'pse',
  };
  
  return Object.keys(params)
    .map(key => {
      if (Object.keys(kufarParams).includes(key)) {
        return kufarParams[key] + '=1';
      }

      return key + '=' + params[key];
    })
    .join('&');
}
