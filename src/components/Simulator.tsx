import {
  StepForward,
  FastForward,
  RotateCcw,
  Check,
  ListChecks,
} from 'lucide-react';

interface SimulatorProps {
  simMode: 'single' | 'batch';
  setSimMode: (val: 'single' | 'batch') => void;
  testString: string;
  setTestString: (val: string) => void;
  simIndex: number;
  simStatus: 'idle' | 'playing' | 'accepted' | 'rejected';
  stepSimulation: () => void;
  fastForwardSimulation: () => void;
  resetSimulation: () => void;
  batchStrings: string;
  setBatchStrings: (val: string) => void;
  runBatchTest: () => void;
  batchResults: { string: string; accepted: boolean }[];
}

export function Simulator({
  simMode,
  setSimMode,
  testString,
  setTestString,
  simIndex,
  simStatus,
  stepSimulation,
  fastForwardSimulation,
  resetSimulation,
  batchStrings,
  setBatchStrings,
  runBatchTest,
  batchResults,
}: SimulatorProps) {
  return (
    <section
      id="simulator-section"
      className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6 transition-colors duration-200 scroll-mt-32"
      aria-label="String Simulator"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Simulator
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setSimMode('single')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${simMode === 'single' ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
          >
            Single Step
          </button>
          <button
            onClick={() => setSimMode('batch')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${simMode === 'batch' ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
          >
            Batch Test
          </button>
        </div>
      </div>

      {simMode === 'single' ? (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="test-string"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Test String
              </label>
              <button
                onClick={() => {
                  setTestString('');
                  resetSimulation();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear
              </button>
            </div>
            <textarea
              id="test-string"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter string to test..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-mono text-sm dark:text-white min-h-20 resize-y"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={stepSimulation}
              disabled={simStatus === 'accepted' || simStatus === 'rejected'}
              aria-label="Step Simulation"
              className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            >
              <StepForward className="w-4 h-4" />
              Step
            </button>
            <button
              onClick={fastForwardSimulation}
              disabled={simStatus === 'accepted' || simStatus === 'rejected'}
              aria-label="Fast Forward Simulation"
              className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            >
              <FastForward className="w-4 h-4" />
              Run
            </button>
            <button
              onClick={resetSimulation}
              aria-label="Reset Simulation"
              className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800"
            aria-live="polite"
          >
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Simulation Progress:
            </div>
            <div className="font-mono text-lg tracking-widest flex flex-wrap gap-1">
              {testString.split('').map((char, i) => (
                <span
                  key={i}
                  className={`px-1 rounded ${
                    i < simIndex
                      ? 'text-gray-400 dark:text-gray-500'
                      : i === simIndex
                        ? 'bg-yellow-200 dark:bg-yellow-500/20 text-black dark:text-yellow-200 font-bold'
                        : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {char}
                </span>
              ))}
              {testString.length === 0 && (
                <span className="text-gray-500 dark:text-gray-400 italic text-sm">
                  Empty string (ε)
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Status:
              </div>
              {simStatus === 'idle' && (
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Ready to start
                </span>
              )}
              {simStatus === 'playing' && (
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  Processing...
                </span>
              )}
              {simStatus === 'accepted' && (
                <span className="text-green-700 dark:text-green-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> String Accepted!
                </span>
              )}
              {simStatus === 'rejected' && (
                <span className="text-red-700 dark:text-red-400 font-bold">
                  String Rejected
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 flex flex-col">
            <label
              htmlFor="batch-strings"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Test Strings (One per line)
            </label>
            <textarea
              id="batch-strings"
              value={batchStrings}
              onChange={(e) => setBatchStrings(e.target.value)}
              placeholder="Enter multiple strings..."
              className="flex-1 min-h-37.5 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-mono text-sm resize-none dark:text-white"
            />
          </div>
          <button
            onClick={runBatchTest}
            className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
          >
            <ListChecks className="w-4 h-4" />
            Run Batch Test
          </button>

          {batchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col max-h-62.5>">
              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                <span>String</span>
                <span>Result</span>
              </div>
              <div className="overflow-y-auto flex-1">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batchResults.map((res, i) => (
                    <li
                      key={i}
                      className="px-3 py-2 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <span
                        className="font-mono text-gray-800 dark:text-gray-200 truncate mr-4"
                        title={res.string || 'ε'}
                      >
                        {res.string || (
                          <span className="text-gray-400 italic">ε</span>
                        )}
                      </span>
                      <span
                        className={`font-medium px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${res.accepted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                      >
                        {res.accepted ? 'Accepted' : 'Rejected'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
