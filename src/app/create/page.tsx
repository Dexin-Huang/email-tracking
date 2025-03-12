// src/app/create/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function CreateTrackingPixel() {
  const [label, setLabel] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPixel, setNewPixel] = useState<{trackingId: string; label: string; trackingUrl: string} | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Create New Tracking Pixel</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="space-y-4 mb-6">
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
            !label ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
          } text-white font-medium`}
        >
          {loading ? 'Generating...' : 'Generate Tracking Pixel'}
        </button>

        {newPixel && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium mb-2">New Tracking Pixel Generated</h3>
            <p className="mb-3"><strong>Label:</strong> {newPixel.label}</p>

            <div className="flex">
              <input
                type="text"
                value={newPixel.trackingUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md
                          dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => copyToClipboard(newPixel.trackingUrl)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r-md"
              >
                Copy
              </button>
            </div>

            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md text-sm border border-yellow-200 dark:border-yellow-800">
              <p className="font-medium mb-2">How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>In Gmail, compose a new email</li>
                <li>Click the &quot;Insert photo&quot; button</li>
                <li>Select &quot;Web Address (URL)&quot;</li>
                <li>Paste this tracking URL and insert</li>
                <li>Complete your email and send</li>
              </ol>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setNewPixel(null)}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium"
              >
                Generate Another
              </button>
              
              <Link
                href="/"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}