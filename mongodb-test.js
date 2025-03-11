// mongodb-test.js
const { MongoClient } = require('mongodb');
require('dotenv').config(); // If you have environment variables in a .env file

async function testConnection() {
  console.log('Starting connection test...');
  console.time('Connection test');

  // Connection URI from environment variables
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables');
    return;
  }

  let client;

  try {
    console.log('Attempting to connect to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Successfully connected to MongoDB!');

    // Test database access
    const db = client.db(process.env.MONGODB_DB);
    console.log(`Connected to database: ${process.env.MONGODB_DB}`);

    // Test collection access and basic query
    const collections = await db.listCollections().toArray();
    console.log(`Available collections: ${collections.map(c => c.name).join(', ')}`);

    // Test a simple query on the pixels collection
    const pixelsCount = await db.collection('pixels').countDocuments();
    console.log(`Number of documents in pixels collection: ${pixelsCount}`);

    console.log('All tests passed successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    if (client) {
      console.log('Closing connection');
      await client.close();
    }
    console.timeEnd('Connection test');
  }
}

testConnection();