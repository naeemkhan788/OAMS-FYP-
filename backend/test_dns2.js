const https = require('https');
const url = 'https://cloudflare-dns.com/dns-query?name=cluster0oa.s5jn8lc.mongodb.net&type=TXT';
const options = {
  headers: {
    'accept': 'application/dns-json'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      console.log(JSON.parse(data));
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', err => {
  console.error('HTTPS Error:', err.message);
});
