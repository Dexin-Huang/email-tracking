// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { EmailStats } from '@/types';

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Get tracking ID from the URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing tracking ID' },
      { status: 400, headers }
    );
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Get pixel information
    const pixel = await db.collection('pixels').findOne({ trackingId: id });

    if (!pixel) {
      return NextResponse.json(
        { error: 'Tracking ID not found' },
        { status: 404, headers }
      );
    }

    // Get all opens for this tracking ID
    const opens = await db.collection('opens')
      .find({ trackingId: id })
      .sort({ timestamp: -1 })
      .toArray();

    // Process data for response
    const firstOpen = opens.length > 0 ? opens[opens.length - 1].timestamp : null;
    const lastOpen = opens.length > 0 ? opens[0].timestamp : null;

    // Get unique opens by IP (simple deduplication)
    const uniqueIps = [...new Set(opens.map(open => open.ip))];

    const response: EmailStats = {
      trackingId: id,
      label: pixel.label,
      created: pixel.created,
      recipient: pixel.recipient || undefined,
      subject: pixel.subject || undefined,
      stats: {
        totalOpens: opens.length,
        uniqueOpens: uniqueIps.length,
        firstOpen,
        lastOpen
      },
      opens: opens.map(open => ({
        timestamp: open.timestamp,
        ip: open.ip,
        userAgent: open.userAgent
      }))
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}