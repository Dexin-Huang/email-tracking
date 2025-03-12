import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { TrackingPixel } from '@/types';

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 200 });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { label, recipient, subject, sentAt } = body || {};

    // Generate a unique ID (8 characters for brevity in URLs)
    const trackingId = crypto.randomBytes(4).toString('hex');

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Store the new tracking pixel info
    const pixelData: TrackingPixel = {
      trackingId,
      label: label || 'Unnamed Email',
      recipient: recipient || undefined,
      subject: subject || undefined,
      created: new Date(),
      sentAt: sentAt || undefined, // Store the sent timestamp
    };

    await db.collection('pixels').insertOne(pixelData);

    // Calculate full tracking URL with proper protocol
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }

    // Ensure baseUrl has a protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // Return the tracking info with CORS headers
    return NextResponse.json({
      trackingId,
      trackingUrl: `${baseUrl}/api/track?id=${trackingId}`,
      label: label || 'Unnamed Email'
    }, { headers });

  } catch (error) {
    console.error('Error generating tracking ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate tracking ID' },
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