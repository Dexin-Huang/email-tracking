// src/app/api/delete-pixel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function DELETE(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    // Delete the tracking pixel
    const pixelResult = await db.collection('pixels').deleteOne({ trackingId: id });

    // Delete all associated opens
    const opensResult = await db.collection('opens').deleteMany({ trackingId: id });

    if (pixelResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Tracking ID not found' },
        { status: 404, headers }
      );
    }

    return NextResponse.json({
      success: true,
      deletedPixel: pixelResult.deletedCount,
      deletedOpens: opensResult.deletedCount
    }, { headers });

  } catch (error) {
    console.error('Error deleting tracking pixel:', error);
    return NextResponse.json(
      { error: 'Failed to delete tracking pixel' },
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}