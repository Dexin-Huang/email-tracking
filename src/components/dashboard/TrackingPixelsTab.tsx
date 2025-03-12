"use client";

import Link from 'next/link';
import { TrackingPixel, OpenEvent } from '@/types';

interface TrackingPixelsTabProps {
  pixels: TrackingPixel[];
  opens: OpenEvent[];
  showAutoLoads: boolean;
  copyToClipboard: (text: string) => void;
  confirmDelete: string | null;
  deletePixel: (trackingId: string) => void;
  loading: boolean;
  formatDate: (date: string | Date | undefined) => string;
}

export default function TrackingPixelsTab({
  pixels,
  opens,
  showAutoLoads,
  copyToClipboard,
  confirmDelete,
  deletePixel,
  loading,
  formatDate
}: TrackingPixelsTabProps) {
  if (pixels.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tracking Pixels</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">No tracking pixels created yet.</p>
        <div className="mt-4">
          <Link
            href="/create"
            className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Create New Tracking Pixel
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Tracking Pixels</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Email</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Recipient</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Created</th>
              <th className="text-center p-3 border-b border-gray-200 dark:border-gray-700">Opens</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pixels.map((pixel) => {
              // Count opens for this pixel based on filter setting
              const pixelAllOpens = opens.filter(open => open.trackingId === pixel.trackingId);
              const pixelFilteredOpens = pixelAllOpens.filter(open => !open.isInitialLoad);
              const pixelOpens = showAutoLoads ? pixelAllOpens : pixelFilteredOpens;
              
              return (
                <tr key={pixel.trackingId} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-3">
                    <Link
                      href={`/email/${pixel.trackingId}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {pixel.label}
                    </Link>
                    {pixel.subject && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {pixel.subject}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {pixel.recipient || '—'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {formatDate(pixel.created)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`
                      ${pixelOpens.length > 0 
                        ? 'text-green-600 dark:text-green-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-400'}
                    `}>
                      {pixelOpens.length}
                      {pixelFilteredOpens.length !== pixelAllOpens.length && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({pixelAllOpens.length})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(`${baseUrl || window.location.origin}/api/track?id=${pixel.trackingId}`)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300
                                dark:hover:bg-gray-600 rounded-md text-sm"
                        title="Copy tracking URL"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => deletePixel(pixel.trackingId)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          confirmDelete === pixel.trackingId
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400'
                        }`}
                        disabled={loading}
                        title={confirmDelete === pixel.trackingId ? 'Confirm delete' : 'Delete tracking pixel'}
                      >
                        {confirmDelete === pixel.trackingId ? 'Confirm Delete' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <Link
          href="/create"
          className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
        >
          Create New Tracking Pixel
        </Link>
      </div>
    </div>
  );
}