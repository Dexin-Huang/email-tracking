// test-generate-core.js
require('dotenv').config();
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

async function testGenerateCore() {
  console.log('Testing core generate functionality...');
  console.time('Execution time');

  let client;

  try {
    // Mock request data
    const requestData = {
      label: 'Test Email',
      recipient: 'test@example.com',
      subject: 'Testing 123'
    };

    console.log('Processing request with data:', requestData);

    // Generate tracking ID
    const trackingId = crypto.randomBytes(4).toString('hex');
    console.log('Generated tracking ID:', trackingId);

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.time('MongoDB connection');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.timeEnd('MongoDB connection');

    const db = client.db(process.env.MONGODB_DB);

    // Prepare data
    const pixelData = {
      trackingId,
      label: requestData.label || 'Unnamed Email',
      recipient: requestData.recipient || undefined,
      subject: requestData.subject || undefined,
      created: new Date()
    };

    // Insert document
    console.log('Inserting document into pixels collection...');
    console.time('Database insertion');
    await db.collection('pixels').insertOne(pixelData);
    console.timeEnd('Database insertion');

    // Calculate tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/api/track?id=${trackingId}`;

    console.log('✅ Success!');
    console.log('Tracking ID:', trackingId);
    console.log('Tracking URL:', trackingUrl);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }

  console.timeEnd('Execution time');
}

testGenerateCore();