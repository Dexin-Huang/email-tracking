"use client";

interface AutoLoadFilterProps {
  showAutoLoads: boolean;
  setShowAutoLoads: (show: boolean) => void;
  openCounts: {
    autoLoads: number;
    realOpens: number;
  };
}

export default function AutoLoadFilter({ 
  showAutoLoads, 
  setShowAutoLoads, 
  openCounts 
}: AutoLoadFilterProps) {
  return (
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
  );
}