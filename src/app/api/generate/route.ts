// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { TrackingPixel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { label, recipient, subject } = body || {};

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
    };

    await db.collection('pixels').insertOne(pixelData);

    // Calculate full tracking URL
    // For local dev: http://localhost:3000
    // For production: https://your-vercel-domain.vercel.app
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Return the tracking info
    return NextResponse.json({
      trackingId,
      trackingUrl: `${baseUrl}/api/track?id=${trackingId}`,
      label: label || 'Unnamed Email'
    });

  } catch (error) {
    console.error('Error generating tracking ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate tracking ID' },
      { status: 500 }
    );
  }
}