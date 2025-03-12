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
  const sentAtParam = searchParams.get('sentAt');

  // Set response headers for the image
  const headers = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // If no tracking ID provided, just return the pixel
  if (!id) {
    return new NextResponse(TRANSPARENT_GIF_BUFFER, { headers });
  }

  try {
    // Check if this is likely Gmail's initial load
    let isInitialLoad = false;
    if (sentAtParam) {
      const sentAt = parseInt(sentAtParam, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - sentAt;

      // Consider it an initial load if less than 30 seconds have passed
      // You can adjust this threshold based on observed behavior
      const INITIAL_LOAD_THRESHOLD = 30 * 1000; // 30 seconds in milliseconds
      isInitialLoad = timeDiff < INITIAL_LOAD_THRESHOLD;

      console.log(`Time since send: ${timeDiff}ms, Threshold: ${INITIAL_LOAD_THRESHOLD}ms, Is initial load: ${isInitialLoad}`);
    }

    // Prepare log entry
    const logEntry: OpenEvent = {
      trackingId: id,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
      isInitialLoad: isInitialLoad || false // Add this to your OpenEvent type
    };

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Log the open event
    // We still log initial loads, but mark them as such
    await db.collection('opens').insertOne(logEntry);

    console.log(`Tracked open for ID: ${id}${isInitialLoad ? ' (initial load)' : ''}`);
  } catch (error) {
    console.error('Error logging open event:', error);
    // Continue to serve pixel even if logging fails
  }

  // Return the tracking pixel
  return new NextResponse(TRANSPARENT_GIF_BUFFER, { headers });
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