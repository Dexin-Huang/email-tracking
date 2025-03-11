// src/app/page.js
import { Metadata } from 'next';
import Dashboard from '@/components/Dashboard';
import clientPromise from '@/lib/mongodb';
import { TrackingPixel, OpenEvent } from '@/types';

// Set revalidation to 0 to disable cache for this route
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Email Tracker Dashboard',
  description: 'Monitor your email opens with a simple tracking system',
};

async function getTrackingData() {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Get all tracking pixels
    const pixels = await db.collection('pixels')
      .find({})
      .sort({ created: -1 })
      .toArray();
      
    // Get recent opens
    const opens = await db.collection('opens')
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    // Convert MongoDB documents to plain objects
    return {
      pixels: JSON.parse(JSON.stringify(pixels)) as TrackingPixel[],
      opens: JSON.parse(JSON.stringify(opens)) as OpenEvent[]
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      pixels: [],
      opens: []
    };
  }
}

export default async function Home() {
  const { pixels, opens } = await getTrackingData();
  
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <Dashboard initialPixels={pixels} initialOpens={opens} />
    </main>
  );
}