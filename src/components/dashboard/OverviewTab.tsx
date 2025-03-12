"use client";

import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { AnalyticsData } from '@/types';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
    pointBackgroundColor?: string;
  }[];
}

interface OverviewTabProps {
  analyticsData: AnalyticsData | null;
  opensOverTimeData: ChartData | null;
  topEmailsData: ChartData | null;
  opensByDayData: ChartData | null;
  opensByHourData: ChartData | null;
  browsersData: ChartData | null;
  devicesData: ChartData | null;
}

export default function OverviewTab({
  analyticsData,
  opensOverTimeData,
  topEmailsData,
  opensByDayData,
  opensByHourData,
  browsersData,
  devicesData,
}: OverviewTabProps) {
  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <p className="mb-2 text-lg">No analytics data available yet</p>
        <p>Start tracking emails to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Emails Tracked</div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {analyticsData.totalEmails}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Emails Opened</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {analyticsData.openedEmails}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Open Rate</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analyticsData.openRate}%
          </div>
        </div>
      </div>

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
    </div>
  );
}