// src/components/Dashboard.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { TrackingPixel, OpenEvent } from '@/types';

interface DashboardProps {
  initialPixels: TrackingPixel[];
  initialOpens: OpenEvent[];
}

export default function Dashboard({ initialPixels, initialOpens }: DashboardProps) {
  const [pixels, setPixels] = useState<TrackingPixel[]>(initialPixels);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [opens, setOpens] = useState<OpenEvent[]>(initialOpens);
  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [newPixel, setNewPixel] = useState<{trackingId: string; label: string; trackingUrl: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate new tracking pixel
  const generatePixel = async () => {
    if (!label) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, recipient, subject })
      });

      if (response.ok) {
        const data = await response.json();
        setNewPixel(data);

        // Add the new pixel to the list
        setPixels([{
          trackingId: data.trackingId,
          label: data.label,
          recipient,
          subject,
          created: new Date().toISOString()
        }, ...pixels]);

        // Clear form
        setLabel('');
        setRecipient('');
        setSubject('');
      } else {
        alert('Failed to generate tracking pixel');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
    setLoading(false);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-2">Email Tracker Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate tracking pixels to monitor when your emails are opened
        </p>
      </header>

      {/* Generate new pixel section */}
      <section className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Create New Tracking Pixel</h2>

        <div className="space-y-4 mb-4">
          <div>
            <label htmlFor="label" className="block mb-1 font-medium">
              Email Description*
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="March Newsletter"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                        dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="recipient" className="block mb-1 font-medium">
              Recipient (optional)
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="client@example.com"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                        dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block mb-1 font-medium">
              Email Subject (optional)
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="March Newsletter Updates"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                        dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={generatePixel}
          disabled={loading || !label}
          className={`py-2 px-4 rounded-md ${
            !label ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium`}
        >
          {loading ? 'Generating...' : 'Generate Tracking Pixel'}
        </button>

        {newPixel && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium mb-2">New Tracking Pixel Generated</h3>
            <p className="mb-1"><strong>Label:</strong> {newPixel.label}</p>

            <div className="flex mt-2">
              <input
                type="text"
                value={newPixel.trackingUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md
                          dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => copyToClipboard(newPixel.trackingUrl)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-r-md"
              >
                Copy
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md text-sm border border-yellow-200 dark:border-yellow-800">
              <p className="font-medium mb-1">How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>In Gmail, compose a new email</li>
                <li>Click the &quot;Insert photo&quot; button</li>
                <li>Select &quot;Web Address (URL)&quot;</li>
                <li>Paste this tracking URL and insert</li>
                <li>Complete your email and send</li>
              </ol>
            </div>
          </div>
        )}
      </section>

      {/* Tracking pixels list */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Tracking Pixels</h2>
        {pixels.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">No tracking pixels created yet.</p>
        ) : (
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
                  // Count opens for this pixel
                  const pixelOpens = opens.filter(open => open.trackingId === pixel.trackingId);
                  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

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
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => copyToClipboard(`${baseUrl || window.location.origin}/api/track?id=${pixel.trackingId}`)}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300
                                   dark:hover:bg-gray-600 rounded-md text-sm"
                        >
                          Copy URL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent opens list */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Opens</h2>
        {opens.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">No opens recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Email</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Opened At</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {opens.slice(0, 10).map((open, index) => {
                  // Find pixel info
                  const pixel = pixels.find(p => p.trackingId === open.trackingId) || { label: 'Unknown' };

                  return (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}