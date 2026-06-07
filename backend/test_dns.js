const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolveTxt('cluster0oa.s5jn8lc.mongodb.net', (err, records) => {
  if (err) {
    console.error('DNS TXT Error:', err);
  } else {
    console.log('TXT Records:', records);
  }
});

dns.resolveSrv('_mongodb._tcp.cluster0oa.s5jn8lc.mongodb.net', (err, records) => {
  if (err) {
    console.error('DNS SRV Error:', err);
  } else {
    console.log('SRV Records:', records);
  }
});
