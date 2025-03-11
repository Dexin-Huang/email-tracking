// src/components/EmailDetail.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { EmailStats } from '@/types';

interface EmailDetailProps {
  initialData: EmailStats;
}

export default function EmailDetail({ initialData }: EmailDetailProps) {
  const [data, setData] = useState<EmailStats>(initialData);
  const [loading, setLoading] = useState(false);

  // Function to refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats?id=${data.trackingId}`);
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setLoading(false);
  };

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Copy tracking URL to clipboard
  const copyTrackingUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const trackingUrl = `${baseUrl}/api/track?id=${data.trackingId}`;

    navigator.clipboard.writeText(trackingUrl)
      .then(() => alert('Tracking URL copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Email header info */}
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2">{data.label}</h1>

        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          {data.subject && <p>Subject: {data.subject}</p>}
          {data.recipient && <p>Recipient: {data.recipient}</p>}
          <p>Created: {formatDate(data.created)}</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={copyTrackingUrl}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                     dark:hover:bg-gray-600 rounded-md text-sm font-medium"
          >
            Copy Tracking URL
          </button>

          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md text-sm font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Opens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.stats.totalOpens}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Opens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.stats.uniqueOpens}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">First Opened</div>
          <div className={`text-base ${data.stats.firstOpen ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(data.stats.firstOpen)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Last Opened</div>
          <div className={`text-base ${data.stats.lastOpen ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(data.stats.lastOpen)}
          </div>
        </div>
      </div>

      {/* Opens table */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Open Events</h2>

        {data.opens.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            This email has not been opened yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Timestamp</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">IP Address</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {data.opens.map((open, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-3 text-gray-600 dark:text-gray-300">{formatDate(open.timestamp)}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{open.ip}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                      {open.userAgent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}