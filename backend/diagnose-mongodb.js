const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const diagnoseConnection = async () => {
  console.log('\n🔍 MONGODB DIAGNOSTIC REPORT\n');
  console.log('=' .repeat(50));
  
  // Check 1: Environment Variable
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('❌ MONGODB_URI is NOT set in .env file');
    return;
  }
  console.log('✅ MONGODB_URI found in .env');
  console.log(`   Connection String: ${uri.substring(0, 50)}...`);
  
  // Check 2: Try to connect
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('\n✅ MongoDB Connection SUCCESS');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port}`);
    
    // Check 3: Load all models
    require('./models/User');
    require('./models/Class');
    require('./models/Attendance');
    require('./models/Marks');
    
    const models = mongoose.modelNames();
    console.log(`\n✅ Models Loaded: ${models.join(', ')}`);
    
    // Check 4: Create collections
    console.log('\n📦 Creating Collections...');
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      try {
        await model.createCollection();
        const count = await model.countDocuments();
        console.log(`   ✅ ${modelName} (${count} documents)`);
      } catch (err) {
        if (err.codeName === 'NamespaceExists' || err.code === 48) {
          const count = await model.countDocuments();
          console.log(`   ✅ ${modelName} (exists, ${count} documents)`);
        } else {
          console.log(`   ❌ ${modelName}: ${err.message}`);
        }
      }
    }
    
    // Check 5: List all collections
    console.log('\n📋 Collections in Database:');
    const collections = await conn.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('   ⚠️  No collections found!');
    } else {
      for (const col of collections) {
        console.log(`   ✅ ${col.name}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📍 TO CONNECT IN COMPASS:');
    console.log(`1. Open MongoDB Compass`);
    console.log(`2. Click "New Connection"`);
    console.log(`3. Paste: ${uri}`);
    console.log(`4. Click "Connect"`);
    console.log(`5. Look for database: "${conn.connection.name}"`);
    console.log('\n' + '='.repeat(50) + '\n');
    
    process.exit(0);
  } catch (err) {
    console.log('\n❌ MongoDB Connection FAILED');
    console.log(`   Error: ${err.message}`);
    console.log('\n⚡ SOLUTIONS:');
    console.log('1. Make sure MONGODB_URI in .env is correct');
    console.log('2. Check MongoDB Atlas credentials (username/password)');
    console.log('3. Check network access is enabled in Atlas (0.0.0.0/0)');
    console.log('4. Test the connection string in MongoDB Compass first\n');
    process.exit(1);
  }
};

diagnoseConnection();
