// src/app/api/dashboard-data/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { TrackingPixel, OpenEvent } from '@/types';

export async function GET() {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

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
    return NextResponse.json({
      pixels: JSON.parse(JSON.stringify(pixels)) as TrackingPixel[],
      opens: JSON.parse(JSON.stringify(opens)) as OpenEvent[]
    }, { headers });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', pixels: [], opens: [] },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request explicitly for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}