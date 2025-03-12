// src/components/EmailDetail.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { EmailStats } from '@/types';
import { Bar } from 'react-chartjs-2';

interface EmailDetailProps {
  initialData: EmailStats;
}

export default function EmailDetail({ initialData }: EmailDetailProps) {
  const [data, setData] = useState<EmailStats>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAutoLoads, setShowAutoLoads] = useState(false);
  
  // Filter out auto-loads by default
  const filteredOpens = useMemo(() => {
    return showAutoLoads ? data.opens : data.opens.filter(open => !open.isInitialLoad);
  }, [data.opens, showAutoLoads]);
  
  // Get counts of auto-loads
  const openCounts = useMemo(() => {
    const autoLoads = data.opens.filter(open => open.isInitialLoad).length;
    const realOpens = data.opens.length - autoLoads;
    return { autoLoads, realOpens };
  }, [data.opens]);

  // Function to refresh data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats?id=${data.trackingId}`);
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setLoading(false);
  }, [data.trackingId]);

  // Set up automatic refresh every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(refreshData, 30000);
    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format time since last refresh
  const formatLastRefreshed = () => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
  };

  // Copy tracking URL to clipboard
  const copyTrackingUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const trackingUrl = `${baseUrl}/api/track?id=${data.trackingId}`;

    navigator.clipboard.writeText(trackingUrl)
      .then(() => alert('Tracking URL copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  // Delete tracking pixel
  const deletePixel = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/delete-pixel?id=${data.trackingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Failed to delete tracking pixel');
        setConfirmDelete(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
      setConfirmDelete(false);
    }
    setLoading(false);
  };

  // Filter opens based on the auto-load flag
  const filteredOpens = useMemo(() => {
    if (!data.opens) return [];
    return showAutoLoads
      ? data.opens
      : data.opens.filter(open => !open.isInitialLoad);
  }, [data.opens, showAutoLoads]);

  // Calculate time-based stats on filtered opens
  const timeStats = useMemo(() => {
    if (!filteredOpens.length) return null;

    // Opens by hour of day
    const opensByHour = Array(24).fill(0);
    filteredOpens.forEach(open => {
      const hour = new Date(open.timestamp).getHours();
      opensByHour[hour]++;
    });

    // Opens by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const opensByDay = Array(7).fill(0);

    filteredOpens.forEach(open => {
      const day = new Date(open.timestamp).getDay();
      opensByDay[day]++;
    });

    // Parse user agents
    const browsers = {};
    const devices = {};

    filteredOpens.forEach(open => {
      let browser = 'Unknown';
      let device = 'Unknown';

      const ua = open.userAgent.toLowerCase();

      // Simple browser detection
      if (ua.includes('chrome')) browser = 'Chrome';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
      else if (ua.includes('edge')) browser = 'Edge';
      else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
      else if (ua.includes('trident') || ua.includes('msie')) browser = 'Internet Explorer';

      // Simple device detection
      if (ua.includes('mobile')) device = 'Mobile';
      else if (ua.includes('tablet')) device = 'Tablet';
      else if (ua.includes('ipad')) device = 'Tablet';
      else device = 'Desktop';

      if (!browsers[browser]) browsers[browser] = 0;
      browsers[browser]++;

      if (!devices[device]) devices[device] = 0;
      devices[device]++;
    });

    const topBrowser = Object.entries(browsers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const topDevice = Object.entries(devices).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Get open dates in order
    const openDates = filteredOpens.map(open => new Date(open.timestamp))
      .sort((a, b) => a.getTime() - b.getTime());

    // Calculate median time to open (if there was a created date)
    let medianTimeToOpen = null;
    if (data.created && openDates.length) {
      const createdDate = new Date(data.created);
      const timeToOpenMinutes = openDates.map(date =>
        Math.floor((date.getTime() - createdDate.getTime()) / 60000)
      );

      // Calculate median
      const sortedTimes = [...timeToOpenMinutes].sort((a, b) => a - b);
      const mid = Math.floor(sortedTimes.length / 2);

      medianTimeToOpen = sortedTimes.length % 2 === 0
        ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
        : sortedTimes[mid];
    }

    return {
      opensByHour,
      opensByDay,
      dayNames,
      topBrowser,
      topDevice,
      medianTimeToOpen
    };
  }, [filteredOpens, data.created]);

  // Chart data for opens by hour
  const opensByHourData = useMemo(() => {
    if (!timeStats) return null;

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Opens by Hour',
          data: timeStats.opensByHour,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
      ],
    };
  }, [timeStats]);

  // Chart data for opens by day of week
  const opensByDayData = useMemo(() => {
    if (!timeStats) return null;

    return {
      labels: timeStats.dayNames,
      datasets: [
        {
          label: 'Opens by Day of Week',
          data: timeStats.opensByDay,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
        },
      ],
    };
  }, [timeStats]);

  // Get counts of real vs. auto-load opens
  const openCounts = useMemo(() => {
    if (!data.opens) return { real: 0, auto: 0 };
    const auto = data.opens.filter(open => open.isInitialLoad).length;
    const real = data.opens.length - auto;
    return { real, auto };
  }, [data.opens]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>

        <div className="text-sm text-gray-500">
          Last updated: {formatLastRefreshed()}
        </div>
      </div>

      {/* Email header info */}
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2">{data.label}</h1>

        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          {data.subject && <p>Subject: {data.subject}</p>}
          {data.recipient && <p>Recipient: {data.recipient}</p>}
          <p>Created: {formatDate(data.created)}</p>
        </div>
        
        {/* Auto-load indicator if any exist */}
        {openCounts.autoLoads > 0 && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Opens:</span> {openCounts.realOpens} real / {openCounts.autoLoads} auto-loads
            <button 
              onClick={() => setShowAutoLoads(!showAutoLoads)}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAutoLoads ? 'Hide auto-loads' : 'Show all opens'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
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
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>

          <button
            onClick={deletePixel}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              confirmDelete
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400'
            }`}
          >
            {confirmDelete ? 'Confirm Delete' : 'Delete Tracking Pixel'}
          </button>
        </div>
      </div>

      {/* Stats summary with real vs auto-load notification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Opens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {openCounts.real}
          </div>
          {openCounts.auto > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="cursor-pointer hover:underline" onClick={() => setShowAutoLoads(!showAutoLoads)}>
                {showAutoLoads ? 'Hiding' : 'Hidden'}: {openCounts.auto} Gmail auto-load{openCounts.auto !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Opens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.stats.uniqueOpens}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">First Opened</div>
          <div className={`text-base ${data.stats.firstOpen ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(data.stats.firstOpen)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Last Opened</div>
          <div className={`text-base ${data.stats.lastOpen ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {formatDate(data.stats.lastOpen)}
          </div>
        </div>
      </div>

      {/* Enhanced analytics */}
      {timeStats && filteredOpens.length > 0 && (
        <section className="space-y-8 mb-8">
          <h2 className="text-xl font-semibold">Email Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Top Browser</div>
              <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {timeStats.topBrowser}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Top Device</div>
              <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {timeStats.topDevice}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Median Time to Open</div>
              <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                {timeStats.medianTimeToOpen !== null
                  ? `${timeStats.medianTimeToOpen} minutes`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opens by hour */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Opens by Hour of Day</h3>
              <div className="h-64">
                {opensByHourData && <Bar
                  data={opensByHourData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />}
              </div>
            </div>

            {/* Opens by day of week */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Opens by Day of Week</h3>
              <div className="h-64">
                {opensByDayData && <Bar
                  data={opensByDayData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Opens table */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Open Events</h2>

          {openCounts.auto > 0 && (
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showAutoLoads}
                  onChange={() => setShowAutoLoads(!showAutoLoads)}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Show Gmail auto-loads
                </span>
              </label>
            </div>
          )}
        </div>

        {filteredOpens.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            {data.opens.length > 0
              ? "All opens were filtered out as Gmail auto-loads. Enable 'Show Gmail auto-loads' to see them."
              : "This email has not been opened yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Timestamp</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">IP Address</th>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">User Agent</th>
                  {showAutoLoads && (
                    <th className="text-center p-3 border-b border-gray-200 dark:border-gray-700">Type</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredOpens.map((open, index) => (
                  <tr key={index} className={`border-b border-gray-200 dark:border-gray-700 ${open.isInitialLoad ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{formatDate(open.timestamp)}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{open.ip}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                      {open.userAgent}
                    </td>
                    {showAutoLoads && (
                      <td className="p-3 text-center">
                        {open.isInitialLoad ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Auto-load
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                            Genuine
                          </span>
                        )}
                      </td>
                    )}
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