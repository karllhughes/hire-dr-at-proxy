const fetch = require('node-fetch');
const Feed = require('feed').Feed;

const handleError = (e, response) => {
  console.error(e);
  response.writeHead(500, {
    'Content-Type': 'text/html ',
  });
  response.end('Something went wrong. Please check the server logs for more info.')
}

const getDescription = (item) => {
  if (item.fields.company || item.fields.location) {
    if (item.fields.company && item.fields.location) {
      return item.fields.company + ', ' + item.fields.location;
    } else {
      return item.fields.company || item.fields.location;
    }
  } else if (item.fields.twitter_user) {
    return `via <a href="${item.fields.source_url}">${item.fields.twitter_user}</a> on Twitter`;
  } else {
    return '';
  }
}

const generateFeed = (data) => {
  const feed = new Feed({
    id: "https://hire-dr-at-proxy.karllhughes.now.sh",
    link: "https://hire-dr-at-proxy.karllhughes.now.sh",
    title: "HireDevRels RSS feed",
    description: "An automatically generated feed of DevRel jobs",
  });

  data.records.forEach(item => {
    feed.addItem({
      title: item.fields.title,
      link: item.fields.url,
      image: item.fields.icon ? item.fields.icon[0].thumbnails.large.url : null,
      description: getDescription(item),
      date: new Date(item.fields.created),
    })
  });

  return feed.rss2();
}

module.exports = (request, response) => {
  if (!request.query || (!request.headers['authorization'] && !process.env.AUTHORIZATION)) {
    handleError('`authorization` not set', response);
  }

  fetch(
    'https://api.airtable.com/v0/appKyY3RA0Ktum6CW/jobs?view=up_next',
    {headers: {'Authorization': request.headers['authorization'] || process.env.AUTHORIZATION}}
  )
    .then(res => res.json())
    .then(data => {
      response.send(generateFeed(data));
    })
    .catch(e => handleError(e, response));
};
