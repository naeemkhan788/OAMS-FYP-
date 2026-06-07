const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function test() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('Memory Server URI:', uri);
    await mongoose.connect(uri);
    console.log('✅ Connected to Memory Server');
    await mongoose.disconnect();
    await mongoServer.stop();
  } catch (err) {
    console.error('❌ Memory Server failed:', err);
  }
}

test();
