import React from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Upload,
  Info,
} from 'lucide-react';

interface RegexInputProps {
  regex: string;
  setRegex: (val: string) => void;
  generateAutomata: () => void;
  errorObj: { message: string; index: number } | null;
  examples: { label: string; regex: string }[];
  isOperatorsExpanded: boolean;
  setIsOperatorsExpanded: (val: boolean) => void;
  setShowCheatSheet: (val: boolean) => void;
  handleImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RegexInput({
  regex,
  setRegex,
  generateAutomata,
  errorObj,
  examples,
  isOperatorsExpanded,
  setIsOperatorsExpanded,
  setShowCheatSheet,
  handleImportJson,
}: RegexInputProps) {
  return (
    <section
      id="input-section"
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm transition-colors duration-200 scroll-mt-32"
      aria-labelledby="regex-input-heading"
    >
      <h2 id="regex-input-heading" className="sr-only">
        Input Regular Expression
      </h2>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 w-full">
          <label
            htmlFor="regex"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Regular Expression
          </label>
          <div className="relative">
            <input
              id="regex"
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateAutomata()}
              placeholder="e.g. a(a|b)*b"
              aria-invalid={!!errorObj}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${errorObj ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-black dark:focus:ring-white focus:border-transparent'} rounded-lg focus:outline-none focus:ring-2 font-mono text-lg transition-all dark:text-white`}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={generateAutomata}
            aria-label="Generate Automata"
            className="flex-1 md:flex-none px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
          >
            <Play className="w-4 h-4" />
            Generate
          </button>
          <label className="flex-1 md:flex-none px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {errorObj && (
        <div
          className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex flex-col gap-2"
          role="alert"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Info className="w-4 h-4" />
            {errorObj.message}
          </div>
          {errorObj.index >= 0 && errorObj.index < regex.length && (
            <div className="font-mono bg-white p-2 rounded border border-red-200 relative overflow-x-auto whitespace-pre text-gray-800">
              {regex.substring(0, errorObj.index)}
              <span className="bg-red-200 text-red-900 font-bold underline">
                {regex[errorObj.index]}
              </span>
              {regex.substring(errorObj.index + 1)}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-800 dark:text-gray-200">
          Examples:
        </span>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => {
              setRegex(ex.regex);
              setTimeout(generateAutomata, 0);
            }}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <button
            onClick={() => setIsOperatorsExpanded(!isOperatorsExpanded)}
            className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200 sm:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white rounded"
          >
            Supported operators:
            <span className="sm:hidden">
              {isOperatorsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
          <button
            onClick={() => setShowCheatSheet(true)}
            className="sm:hidden flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <HelpCircle className="w-3 h-3" /> Cheat Sheet
          </button>
        </div>

        <div
          className={`${isOperatorsExpanded ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 mt-2 sm:mt-0`}
        >
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            |
          </code>{' '}
          (Union)
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            *
          </code>{' '}
          (Zero or more)
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            +
          </code>{' '}
          (One or more)
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            ?
          </code>{' '}
          (Zero or one)
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            []
          </code>{' '}
          (Classes)
          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            ()
          </code>{' '}
          (Grouping)
          <span className="italic ml-2">Concatenation is implicit.</span>
        </div>

        <button
          onClick={() => setShowCheatSheet(true)}
          className="hidden sm:flex ml-auto items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <HelpCircle className="w-3 h-3" /> Cheat Sheet
        </button>
      </div>
    </section>
  );
}
