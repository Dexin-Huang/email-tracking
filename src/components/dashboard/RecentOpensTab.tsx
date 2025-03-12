"use client";

import Link from 'next/link';
import { OpenEvent, TrackingPixel } from '@/types';

interface RecentOpensTabProps {
  filteredOpens: OpenEvent[];
  opens: OpenEvent[];
  pixels: TrackingPixel[];
  formatDate: (date: string | Date | undefined) => string;
}

export default function RecentOpensTab({
  filteredOpens,
  opens,
  pixels,
  formatDate
}: RecentOpensTabProps) {
  if (filteredOpens.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Opens</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">
          {opens.length === 0 ? 
            "No opens recorded yet." : 
            "No real opens detected (only auto-loads). Toggle 'Show All Opens' to see auto-loads."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Opens</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Email</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Opened At</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">IP Address</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Type</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {filteredOpens.slice(0, 20).map((open, index) => {
              // Find pixel info
              const pixel = pixels.find(p => p.trackingId === open.trackingId) || { label: 'Unknown' };

              return (
                <tr key={index} className={`border-b border-gray-200 dark:border-gray-700 ${open.isInitialLoad ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                  <td className="p-3">
                    <Link
                      href={`/email/${open.trackingId}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {pixel.label}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {formatDate(open.timestamp)}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{open.ip}</td>
                  <td className="p-3">
                    {open.isInitialLoad ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                        Auto-load
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                        Real Open
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                    {open.userAgent}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}