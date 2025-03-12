"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrackingPixel, OpenEvent, AnalyticsData } from '@/types';
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
import 'chart.js/auto';

// Import dashboard components
import DashboardHeader from './dashboard/DashboardHeader';
import AutoLoadFilter from './dashboard/AutoLoadFilter';
import DashboardTabs from './dashboard/DashboardTabs';
import OverviewTab from './dashboard/OverviewTab';
import TrackingPixelsTab from './dashboard/TrackingPixelsTab';
import RecentOpensTab from './dashboard/RecentOpensTab';

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
  const analyticsData = useMemo<AnalyticsData | null>(() => {
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
    const emailOpenCounts: Record<string, number> = {};
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
    const browsers: Record<string, number> = {};
    const devices: Record<string, number> = {};

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

      browsers[browser] = (browsers[browser] || 0) + 1;
      devices[device] = (devices[device] || 0) + 1;
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
      {/* Dashboard Header */}
      <DashboardHeader 
        refreshData={fetchLatestData} 
        refreshing={refreshing} 
        lastRefreshedTime={formatLastRefreshed()} 
      />

      {/* Auto-load filter toggle */}
      <AutoLoadFilter 
        showAutoLoads={showAutoLoads} 
        setShowAutoLoads={setShowAutoLoads}
        openCounts={openCounts}
      />

      {/* Analytics Overview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Tabs navigation */}
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <OverviewTab 
              analyticsData={analyticsData}
              opensOverTimeData={opensOverTimeData}
              topEmailsData={topEmailsData}
              opensByDayData={opensByDayData}
              opensByHourData={opensByHourData}
              browsersData={browsersData}
              devicesData={devicesData}
            />
          )}

          {/* Tracking Pixels Tab */}
          {activeTab === 'tracking' && (
            <TrackingPixelsTab
              pixels={pixels}
              opens={opens}
              showAutoLoads={showAutoLoads}
              copyToClipboard={copyToClipboard}
              confirmDelete={confirmDelete}
              deletePixel={deletePixel}
              loading={loading}
              formatDate={formatDate}
            />
          )}

          {/* Recent Opens Tab */}
          {activeTab === 'opens' && (
            <RecentOpensTab
              filteredOpens={filteredOpens}
              opens={opens}
              pixels={pixels}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}