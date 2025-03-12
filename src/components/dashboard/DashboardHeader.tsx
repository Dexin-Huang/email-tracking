"use client";

interface DashboardHeaderProps {
  refreshData: () => Promise<void>;
  refreshing: boolean;
  lastRefreshedTime: string;
}

export default function DashboardHeader({ 
  refreshData, 
  refreshing, 
  lastRefreshedTime 
}: DashboardHeaderProps) {
  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Email Tracker Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and analyze when your emails are opened
        </p>
      </div>

      <div className="flex flex-col items-end">
        <button
          onClick={refreshData}
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
        <span className="text-xs text-gray-500 mt-1">Last updated: {lastRefreshedTime}</span>
      </div>
    </header>
  );
}