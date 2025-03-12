// src/components/Dashboard.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { TrackingPixel, OpenEvent } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface DashboardProps {
  initialPixels: TrackingPixel[];
  initialOpens: OpenEvent[];
}

export default function Dashboard({ initialPixels, initialOpens }: DashboardProps) {
  const [pixels, setPixels] = useState<TrackingPixel[]>(initialPixels);
  const [opens, setOpens] = useState<OpenEvent[]>(initialOpens);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [showAutoLoads, setShowAutoLoads] = useState(false);

  // Filter out auto-loads by default
  const filteredOpens = useMemo(() => {
    return showAutoLoads ? opens : opens.filter(open => !open.isInitialLoad);
  }, [opens, showAutoLoads]);

  // Function to fetch the latest data
  const fetchLatestData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/dashboard-data');
      if (response.ok) {
        const data = await response.json();
        setPixels(data.pixels);
        setOpens(data.opens);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Set up automatic refresh every 30 seconds
  useEffect(() => {
    // Fetch data once on mount
    fetchLatestData();

    // Set up interval for periodic refresh
    const refreshInterval = setInterval(fetchLatestData, 30000); // Refresh every 30 seconds

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [fetchLatestData]);

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

  // Delete tracking pixel
  const deletePixel = async (trackingId: string) => {
    if (confirmDelete !== trackingId) {
      setConfirmDelete(trackingId);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/delete-pixel?id=${trackingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the pixel from the list
        setPixels(pixels.filter(pixel => pixel.trackingId !== trackingId));
        // Remove associated opens
        setOpens(opens.filter(open => open.trackingId !== trackingId));
        setConfirmDelete(null);
      } else {
        alert('Failed to delete tracking pixel');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
    setLoading(false);
  };

  // Get counts of auto-loads
  const openCounts = useMemo(() => {
    const autoLoads = opens.filter(open => open.isInitialLoad).length;
    const realOpens = opens.length - autoLoads;
    return { autoLoads, realOpens };
  }, [opens]);

  // Calculate analytics data for charts
  const analyticsData = useMemo(() => {
    if (!filteredOpens.length) return null;

    // Total emails sent and opened
    const totalEmails = pixels.length;
    const openedEmails = new Set(filteredOpens.map(open => open.trackingId)).size;
    const openRate = totalEmails ? ((openedEmails / totalEmails) * 100).toFixed(1) : '0';

    // Opens by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const opensByDay = Array(7).fill(0);
    
    filteredOpens.forEach(open => {
      const day = new Date(open.timestamp).getDay();
      opensByDay[day]++;
    });

    // Opens by hour of day
    const opensByHour = Array(24).fill(0);
    filteredOpens.forEach(open => {
      const hour = new Date(open.timestamp).getHours();
      opensByHour[hour]++;
    });

    // Top emails by open count
    const emailOpenCounts = {};
    filteredOpens.forEach(open => {
      if (!emailOpenCounts[open.trackingId]) {
        emailOpenCounts[open.trackingId] = 0;
      }
      emailOpenCounts[open.trackingId]++;
    });

    const topEmails = Object.entries(emailOpenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trackingId, count]) => {
        const pixel = pixels.find(p => p.trackingId === trackingId);
        return {
          trackingId,
          label: pixel?.label || 'Unknown',
          count
        };
      });

    // Parse user agents to determine browser/device
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

    const browserData = Object.entries(browsers).map(([browser, count]) => ({
      browser,
      count: count as number
    })).sort((a, b) => b.count - a.count);

    const deviceData = Object.entries(devices).map(([device, count]) => ({
      device,
      count: count as number
    })).sort((a, b) => b.count - a.count);

    // Opens over time (last 14 days)
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

    const opensOverTime = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(twoWeeksAgo);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const count = filteredOpens.filter(open => {
        const openDate = new Date(open.timestamp);
        return openDate >= date && openDate < nextDate;
      }).length;
      
      opensOverTime.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    return {
      totalEmails,
      openedEmails,
      openRate,
      opensByDay,
      dayNames,
      opensByHour,
      topEmails,
      browserData,
      deviceData,
      opensOverTime
    };
  }, [filteredOpens, pixels]);

  // Chart data for opens by day of week
  const opensByDayData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      labels: analyticsData.dayNames,
      datasets: [
        {
          label: 'Opens by Day of Week',
          data: analyticsData.opensByDay,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
        },
      ],
    };
  }, [analyticsData]);

  // Chart data for opens by hour of day
  const opensByHourData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Opens by Hour',
          data: analyticsData.opensByHour,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
      ],
    };
  }, [analyticsData]);

  // Chart data for top emails
  const topEmailsData = useMemo(() => {
    if (!analyticsData?.topEmails?.length) return null;

    return {
      labels: analyticsData.topEmails.map(email => email.label),
      datasets: [
        {
          label: 'Opens',
          data: analyticsData.topEmails.map(email => email.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [analyticsData]);

  // Chart data for browsers
  const browsersData = useMemo(() => {
    if (!analyticsData?.browserData?.length) return null;

    return {
      labels: analyticsData.browserData.map(item => item.browser),
      datasets: [
        {
          label: 'Browsers',
          data: analyticsData.browserData.map(item => item.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [analyticsData]);

  // Chart data for devices
  const devicesData = useMemo(() => {
    if (!analyticsData?.deviceData?.length) return null;

    return {
      labels: analyticsData.deviceData.map(item => item.device),
      datasets: [
        {
          label: 'Devices',
          data: analyticsData.deviceData.map(item => item.count),
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 206, 86, 0.5)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [analyticsData]);

  // Chart data for opens over time
  const opensOverTimeData = useMemo(() => {
    if (!analyticsData?.opensOverTime?.length) return null;

    return {
      labels: analyticsData.opensOverTime.map(day => day.date),
      datasets: [
        {
          label: 'Opens Over Time',
          data: analyticsData.opensOverTime.map(day => day.count),
          fill: true,
          backgroundColor: 'rgba(53, 162, 235, 0.2)',
          borderColor: 'rgb(53, 162, 235)',
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: 'rgb(53, 162, 235)',
        },
      ],
    };
  }, [analyticsData]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Email Tracker Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and analyze when your emails are opened
          </p>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={fetchLatestData}
            disabled={refreshing}
            className={`py-2 px-4 rounded-md ${
              refreshing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium flex items-center gap-2`}
          >
            {refreshing ? (
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
          <span className="text-xs text-gray-500 mt-1">Last updated: {formatLastRefreshed()}</span>
        </div>
      </header>

      {/* Auto-load filter toggle */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-300">Filter Auto-Loads</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {showAutoLoads ? 
              'Showing all opens including auto-loads.' : 
              'Filtering out Gmail auto-loads for more accurate open counts.'}
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold">Real Opens:</span> {openCounts.realOpens} | 
            <span className="font-semibold"> Auto-Loads:</span> {openCounts.autoLoads}
          </div>
        </div>
        <div className="flex items-center">
          <span className={`mr-2 text-sm ${!showAutoLoads ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
            Filter Auto-Loads
          </span>
          <button 
            onClick={() => setShowAutoLoads(!showAutoLoads)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              showAutoLoads ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-600 dark:bg-blue-700'
            }`}
            role="switch"
            aria-checked={!showAutoLoads}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showAutoLoads ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          </button>
          <span className={`ml-2 text-sm ${showAutoLoads ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
            Show All Opens
          </span>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-4 py-3 font-medium ${activeTab === 'overview' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-3 font-medium ${activeTab === 'tracking' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            onClick={() => setActiveTab('tracking')}
          >
            Tracking Pixels
          </button>
          <button 
            className={`px-4 py-3 font-medium ${activeTab === 'opens' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            onClick={() => setActiveTab('opens')}
          >
            Recent Opens
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Emails Tracked</div>
                  <div className="text-3xl font-bold text-gray-800 dark:text-white">
                    {pixels.length}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Emails Opened</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {analyticsData?.openedEmails || 0}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Open Rate</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {analyticsData?.openRate || 0}%
                  </div>
                </div>
              </div>

              {analyticsData && (
                <div className="space-y-8">
                  {/* Opens over time chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Opens Over Time (Last 14 Days)</h3>
                    <div className="h-80">
                      {opensOverTimeData ? (
                        <Line 
                          data={opensOverTimeData} 
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
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-column layout for charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top emails */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Top Emails by Opens</h3>
                      <div className="h-64">
                        {topEmailsData ? (
                          <Bar 
                            data={topEmailsData} 
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
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opens by day of week */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Opens by Day of Week</h3>
                      <div className="h-64">
                        {opensByDayData ? (
                          <Bar 
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
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opens by hour */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Opens by Hour of Day</h3>
                      <div className="h-64">
                        {opensByHourData ? (
                          <Bar 
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
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Device breakdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
                      <div className="h-64 flex justify-center">
                        {devicesData ? (
                          <Doughnut 
                            data={devicesData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom'
                                }
                              }
                            }} 
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Browser breakdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Browser Breakdown</h3>
                      <div className="h-64 flex justify-center">
                        {browsersData ? (
                          <Doughnut 
                            data={browsersData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom'
                                }
                              }
                            }} 
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            No data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!analyticsData && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <p className="mb-2 text-lg">No analytics data available yet</p>
                  <p>Start tracking emails to see analytics</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
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
                        // Count opens for this pixel based on filter setting
                        const pixelAllOpens = opens.filter(open => open.trackingId === pixel.trackingId);
                        const pixelFilteredOpens = pixelAllOpens.filter(open => !open.isInitialLoad);
                        const pixelOpens = showAutoLoads ? pixelAllOpens : pixelFilteredOpens;
                        
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
              )}
              <div className="mt-4">
                <Link
                  href="/create"
                  className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                >
                  Create New Tracking Pixel
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'opens' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Opens</h2>
              {filteredOpens.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  {opens.length === 0 ? 
                    "No opens recorded yet." : 
                    "No real opens detected (only auto-loads). Toggle 'Show All Opens' to see auto-loads."}
                </p>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}