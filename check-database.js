// check-database.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  console.log('Checking database contents...');

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db(process.env.MONGODB_DB);

    // Get all pixels
    const pixels = await db.collection('pixels')
      .find({})
      .sort({ created: -1 })
      .limit(10)
      .toArray();

    console.log('Recent tracking pixels:');
    pixels.forEach((pixel, index) => {
      console.log(`\n[${index + 1}] Tracking ID: ${pixel.trackingId}`);
      console.log(`    Label: ${pixel.label}`);
      console.log(`    Created: ${new Date(pixel.created).toLocaleString()}`);
      console.log(`    Recipient: ${pixel.recipient || 'Not specified'}`);
      console.log(`    Subject: ${pixel.subject || 'Not specified'}`);
    });

    console.log(`\nTotal tracking pixels: ${pixels.length}`);

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkDatabase();