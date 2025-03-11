// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

// In global scope, declare the _mongoClientPromise variable
declare const global: GlobalWithMongo;

// Create cached connection
let cached = global._mongoClientPromise;

if (!cached) {
  cached = global._mongoClientPromise = new MongoClient(uri, options).connect();
}

const clientPromise = cached;

export default clientPromise;