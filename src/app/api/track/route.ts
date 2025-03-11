// src/app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { OpenEvent } from '@/types';

// Create 1x1 transparent GIF buffer once
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  // Get tracking ID from the URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Set response headers for the image
  const headers = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // If no tracking ID provided, just return the pixel
  if (!id) {
    return new NextResponse(TRANSPARENT_GIF_BUFFER, { headers });
  }

  try {
    // Prepare log entry
    const logEntry: OpenEvent = {
      trackingId: id,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || ''
    };

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Log the open event
    await db.collection('opens').insertOne(logEntry);

    console.log(`Tracked open for ID: ${id}`);
  } catch (error) {
    console.error('Error logging open event:', error);
    // Continue to serve pixel even if logging fails
  }

  // Return the tracking pixel
  return new NextResponse(TRANSPARENT_GIF_BUFFER, { headers });
}