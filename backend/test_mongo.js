const { MongoClient } = require('mongodb');

async function test() {
  const uri = 'mongodb://atifkhan35667she_db_user:Atifkhan1122@ac-ucirabu-shard-00-00.s5jn8lc.mongodb.net:27017/?ssl=true&authSource=admin';
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db('admin');
    const result = await db.command({ hello: 1 });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

test();
