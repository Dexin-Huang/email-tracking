"use client";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardTabs({
  activeTab,
  setActiveTab
}: DashboardTabsProps) {
  return (
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
  );
}