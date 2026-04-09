import React, { useState, useEffect } from 'react';
import {
  buildNFA,
  buildDFA,
  minimizeDFA,
  Automaton,
  epsilonClosure,
  move,
  buildNFASteps,
  ConversionStep,
  makeCompleteDFA,
} from './lib/automata';
import { GraphViewer } from './components/GraphViewer';
import { TransitionTable } from './components/TransitionTable';
import { FormalDefinition } from './components/FormalDefinition';
import { Header } from './components/Header';
import { RegexInput } from './components/RegexInput';
import { Simulator } from './components/Simulator';
import {
  Play,
  Info,
  Copy,
  Check,
  StepForward,
  RotateCcw,
  FastForward,
  ListChecks,
  BookOpen,
  Upload,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  const [regex, setRegex] = useState('a(a|b)*b');
  const [nfa, setNfa] = useState<Automaton | null>(null);
  const [dfa, setDfa] = useState<Automaton | null>(null);
  const [minDfa, setMinDfa] = useState<Automaton | null>(null);
  const [nfaSteps, setNfaSteps] = useState<ConversionStep[]>([]);
  const [errorObj, setErrorObj] = useState<{
    message: string;
    index: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'nfa'
    | 'dfa'
    | 'min-dfa'
    | 'nfa-table'
    | 'dfa-table'
    | 'min-dfa-table'
    | 'formal-def'
    | 'conversion-steps'
    | 'imported-graph'
    | 'imported-table'
  >('nfa');
  const [copied, setCopied] = useState(false);

  const [simMode, setSimMode] = useState<'single' | 'batch'>('single');
  const [testString, setTestString] = useState('');
  const [simIndex, setSimIndex] = useState(0);
  const [simActiveStates, setSimActiveStates] = useState<string[]>([]);
  const [simStatus, setSimStatus] = useState<
    'idle' | 'playing' | 'accepted' | 'rejected'
  >('idle');

  const [batchStrings, setBatchStrings] = useState('ab\naab\nbbb\naba');
  const [batchResults, setBatchResults] = useState<
    { string: string; accepted: boolean }[]
  >([]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showDeadStates, setShowDeadStates] = useState(false);
  const [importedAutomaton, setImportedAutomaton] = useState<Automaton | null>(
    null
  );
  const [activeSection, setActiveSection] = useState('input-section');
  const [isOperatorsExpanded, setIsOperatorsExpanded] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const examples = [
    { label: 'Ends with ab', regex: '(a|b)*ab' },
    { label: 'Contains 00', regex: '(0|1)*00(0|1)*' },
    { label: "Even number of a's", regex: '(b*ab*a)*b*' },
    { label: 'Email format', regex: '[a-z]+@[a-z]+.[a-z]+' },
  ];

  const generateAutomata = () => {
    try {
      setErrorObj(null);
      if (!regex.trim()) {
        setNfa(null);
        setDfa(null);
        setMinDfa(null);
        setNfaSteps([]);
        return;
      }
      const generatedNfa = buildNFA(regex);
      setNfa(generatedNfa);
      const generatedDfa = buildDFA(generatedNfa);
      setDfa(generatedDfa);
      const generatedMinDfa = minimizeDFA(generatedDfa);
      setMinDfa(generatedMinDfa);
      try {
        setNfaSteps(buildNFASteps(regex));
      } catch (e) {
        setNfaSteps([]);
      }
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setErrorObj(parsed);
      } catch {
        setErrorObj({
          message: 'Invalid regular expression. Please check your syntax.',
          index: -1,
        });
      }
      setNfa(null);
      setDfa(null);
      setMinDfa(null);
      setNfaSteps([]);
    }
  };

  useEffect(() => {
    generateAutomata();
  }, []);

  useEffect(() => {
    resetSimulation();
    setBatchResults([]);
  }, [nfa, dfa, minDfa, activeTab, testString, showDeadStates]);

  const resetSimulation = () => {
    setSimIndex(0);
    setSimStatus('idle');
    let automaton = activeTab.startsWith('nfa')
      ? nfa
      : activeTab.startsWith('min-dfa')
        ? minDfa
        : dfa;
    if (activeTab === 'imported-graph' || activeTab === 'imported-table')
      automaton = importedAutomaton;

    if (automaton) {
      if (
        showDeadStates &&
        !activeTab.startsWith('nfa') &&
        activeTab !== 'imported-graph' &&
        activeTab !== 'imported-table'
      ) {
        automaton = makeCompleteDFA(automaton);
      }
      if (activeTab.startsWith('nfa')) {
        setSimActiveStates(
          epsilonClosure([automaton.startState], automaton.transitions)
        );
      } else {
        setSimActiveStates([automaton.startState]);
      }
    } else {
      setSimActiveStates([]);
    }
  };

  const stepSimulation = () => {
    if (simStatus === 'accepted' || simStatus === 'rejected') return;
    let automaton = activeTab.startsWith('nfa')
      ? nfa
      : activeTab.startsWith('min-dfa')
        ? minDfa
        : dfa;
    if (activeTab === 'imported-graph' || activeTab === 'imported-table')
      automaton = importedAutomaton;
    if (!automaton) return;

    if (
      showDeadStates &&
      !activeTab.startsWith('nfa') &&
      activeTab !== 'imported-graph' &&
      activeTab !== 'imported-table'
    ) {
      automaton = makeCompleteDFA(automaton);
    }

    if (simIndex >= testString.length) {
      const isAccepted = simActiveStates.some((s: string) =>
        automaton.acceptStates.includes(s)
      );
      setSimStatus(isAccepted ? 'accepted' : 'rejected');
      return;
    }

    const char = testString[simIndex];
    let nextStates: string[] = [];

    if (activeTab.startsWith('nfa')) {
      const moved = move(simActiveStates, char, automaton.transitions);
      nextStates = epsilonClosure(moved, automaton.transitions);
    } else {
      nextStates = move(simActiveStates, char, automaton.transitions);
    }

    setSimActiveStates(nextStates);
    setSimIndex(simIndex + 1);

    if (nextStates.length === 0) {
      setSimStatus('rejected');
    }
  };

  const fastForwardSimulation = () => {
    if (simStatus === 'accepted' || simStatus === 'rejected') return;
    let automaton = activeTab.startsWith('nfa')
      ? nfa
      : activeTab.startsWith('min-dfa')
        ? minDfa
        : dfa;
    if (activeTab === 'imported-graph' || activeTab === 'imported-table')
      automaton = importedAutomaton;
    if (!automaton) return;

    if (
      showDeadStates &&
      !activeTab.startsWith('nfa') &&
      activeTab !== 'imported-graph' &&
      activeTab !== 'imported-table'
    ) {
      automaton = makeCompleteDFA(automaton);
    }

    let currentStates = [...simActiveStates];
    for (let i = simIndex; i < testString.length; i++) {
      const char = testString[i];
      if (activeTab.startsWith('nfa')) {
        const moved = move(currentStates, char, automaton.transitions);
        currentStates = epsilonClosure(moved, automaton.transitions);
      } else {
        currentStates = move(currentStates, char, automaton.transitions);
      }
      if (currentStates.length === 0) break;
    }

    setSimActiveStates(currentStates);
    setSimIndex(testString.length);
    const isAccepted = currentStates.some((s: string) =>
      automaton.acceptStates.includes(s)
    );
    setSimStatus(isAccepted ? 'accepted' : 'rejected');
  };

  const runBatchTest = () => {
    let automaton = activeTab.startsWith('nfa')
      ? nfa
      : activeTab.startsWith('min-dfa')
        ? minDfa
        : dfa;
    if (activeTab === 'imported-graph' || activeTab === 'imported-table')
      automaton = importedAutomaton;
    if (!automaton) return;

    if (
      showDeadStates &&
      !activeTab.startsWith('nfa') &&
      activeTab !== 'imported-graph' &&
      activeTab !== 'imported-table'
    ) {
      automaton = makeCompleteDFA(automaton);
    }

    const strings = batchStrings
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    const results = strings.map((str: string) => {
      let currentStates = activeTab.startsWith('nfa')
        ? epsilonClosure([automaton.startState], automaton.transitions)
        : [automaton.startState];

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (activeTab.startsWith('nfa')) {
          const moved = move(currentStates, char, automaton.transitions);
          currentStates = epsilonClosure(moved, automaton.transitions);
        } else {
          currentStates = move(currentStates, char, automaton.transitions);
        }
        if (currentStates.length === 0) break;
      }
      const isAccepted = currentStates.some((s: string) =>
        automaton.acceptStates.includes(s)
      );
      return { string: str, accepted: isAccepted };
    });
    setBatchResults(results);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (
          json &&
          json.states &&
          json.transitions &&
          json.startState &&
          json.acceptStates
        ) {
          setImportedAutomaton(json);
          setActiveTab('imported-graph' as any);
          setErrorObj(null);
        } else {
          setErrorObj({ message: 'Invalid Automaton JSON format.', index: -1 });
        }
      } catch (err) {
        setErrorObj({ message: 'Failed to parse JSON file.', index: -1 });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const aiPrompt = `Generate a regular expression for [YOUR REQUIREMENT HERE]. Only use the operators: '|' (Union), '*' (Kleene Star), '+' (One or more), '?' (Zero or one), '[]' (Character classes), and '()' (Grouping). Concatenation should be implicit. Do not use advanced regex features like lookaheads or backreferences.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col transition-colors duration-200">
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Regex Syntax Cheat Sheet
              </h3>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 font-semibold">Operator</th>
                    <th className="py-2 font-semibold">Name</th>
                    <th className="py-2 font-semibold">Description</th>
                    <th className="py-2 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        |
                      </code>
                    </td>
                    <td className="py-3 font-medium">Union</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Matches either the expression before or after the
                      operator.
                    </td>
                    <td className="py-3 font-mono">a|b</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        *
                      </code>
                    </td>
                    <td className="py-3 font-medium">Kleene Star</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Matches zero or more occurrences of the preceding element.
                    </td>
                    <td className="py-3 font-mono">a*</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        +
                      </code>
                    </td>
                    <td className="py-3 font-medium">One or More</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Matches one or more occurrences of the preceding element.
                    </td>
                    <td className="py-3 font-mono">a+</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        ?
                      </code>
                    </td>
                    <td className="py-3 font-medium">Zero or One</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Matches zero or one occurrence of the preceding element.
                    </td>
                    <td className="py-3 font-mono">a?</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        ()
                      </code>
                    </td>
                    <td className="py-3 font-medium">Grouping</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Groups multiple tokens together to apply operators to the
                      whole group.
                    </td>
                    <td className="py-3 font-mono">(ab)*</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        []
                      </code>
                    </td>
                    <td className="py-3 font-medium">Character Class</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Matches any single character within the brackets. Supports
                      ranges (e.g., a-z, 0-9).
                    </td>
                    <td className="py-3 font-mono">[a-z0-9]</td>
                  </tr>
                  <tr>
                    <td className="py-3">
                      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        \
                      </code>
                    </td>
                    <td className="py-3 font-medium">Escape</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Escapes special characters to treat them as literals.
                    </td>
                    <td className="py-3 font-mono">\.</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
                <strong>Note:</strong> Concatenation is implicit. For example,{' '}
                <code>ab</code> means "a followed by b".
              </div>
            </div>
          </div>
        </div>
      )}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeSection={activeSection}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <RegexInput
          regex={regex}
          setRegex={setRegex}
          generateAutomata={generateAutomata}
          errorObj={errorObj}
          examples={examples}
          isOperatorsExpanded={isOperatorsExpanded}
          setIsOperatorsExpanded={setIsOperatorsExpanded}
          setShowCheatSheet={setShowCheatSheet}
          handleImportJson={handleImportJson}
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          <section
            id="automata-section"
            className="flex-2 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-125 transition-colors duration-200 scroll-mt-32"
            aria-label="Automata Visualization"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Automata Views
              </span>
              {(activeTab === 'dfa' ||
                activeTab === 'min-dfa' ||
                activeTab === 'dfa-table' ||
                activeTab === 'min-dfa-table' ||
                activeTab === 'formal-def') && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    Show Dead States
                  </span>
                  <div
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white focus-within:ring-offset-2 ${showDeadStates ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={showDeadStates}
                      onChange={(e) => setShowDeadStates(e.target.checked)}
                    />
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${showDeadStates ? 'translate-x-4' : 'translate-x-1'}`}
                    />
                  </div>
                </label>
              )}
            </div>
            <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="sm:hidden p-2">
                <label htmlFor="tabs" className="sr-only">
                  Select a view
                </label>
                <select
                  id="tabs"
                  name="tabs"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 py-2 pl-3 pr-10 text-base focus:border-black focus:outline-none focus:ring-black dark:focus:border-white dark:focus:ring-white sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                >
                  {[
                    { id: 'nfa', label: 'NFA Graph' },
                    { id: 'dfa', label: 'DFA Graph' },
                    { id: 'min-dfa', label: 'Min DFA Graph' },
                    { id: 'nfa-table', label: 'NFA Table' },
                    { id: 'dfa-table', label: 'DFA Table' },
                    { id: 'min-dfa-table', label: 'Min DFA Table' },
                    { id: 'formal-def', label: 'Formal Def' },
                    { id: 'conversion-steps', label: 'Conversion Steps' },
                    ...(importedAutomaton
                      ? [
                          { id: 'imported-graph', label: 'Imported Graph' },
                          { id: 'imported-table', label: 'Imported Table' },
                        ]
                      : []),
                  ].map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="hidden sm:flex overflow-x-auto scrollbar-hide"
                role="tablist"
                aria-label="Automata Views"
              >
                {[
                  { id: 'nfa', label: 'NFA Graph' },
                  { id: 'dfa', label: 'DFA Graph' },
                  { id: 'min-dfa', label: 'Min DFA Graph' },
                  { id: 'nfa-table', label: 'NFA Table' },
                  { id: 'dfa-table', label: 'DFA Table' },
                  { id: 'min-dfa-table', label: 'Min DFA Table' },
                  { id: 'formal-def', label: 'Formal Def' },
                  { id: 'conversion-steps', label: 'Conversion Steps' },
                  ...(importedAutomaton
                    ? [
                        { id: 'imported-graph', label: 'Imported Graph' },
                        { id: 'imported-table', label: 'Imported Table' },
                      ]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 sm:px-6 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800 ${
                      activeTab === tab.id
                        ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-gray-900'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="flex-1 relative min-h-100"
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === 'nfa' && nfa ? (
                <GraphViewer automaton={nfa} activeStates={simActiveStates} />
              ) : activeTab === 'dfa' && dfa ? (
                <GraphViewer
                  automaton={showDeadStates ? makeCompleteDFA(dfa) : dfa}
                  activeStates={simActiveStates}
                />
              ) : activeTab === 'min-dfa' && minDfa ? (
                <GraphViewer
                  automaton={showDeadStates ? makeCompleteDFA(minDfa) : minDfa}
                  activeStates={simActiveStates}
                />
              ) : activeTab === 'nfa-table' && nfa ? (
                <TransitionTable automaton={nfa} />
              ) : activeTab === 'dfa-table' && dfa ? (
                <TransitionTable
                  automaton={showDeadStates ? makeCompleteDFA(dfa) : dfa}
                />
              ) : activeTab === 'min-dfa-table' && minDfa ? (
                <TransitionTable
                  automaton={showDeadStates ? makeCompleteDFA(minDfa) : minDfa}
                />
              ) : activeTab === 'formal-def' && (nfa || dfa) ? (
                <FormalDefinition
                  nfa={nfa}
                  dfa={
                    dfa ? (showDeadStates ? makeCompleteDFA(dfa) : dfa) : null
                  }
                  minDfa={
                    minDfa
                      ? showDeadStates
                        ? makeCompleteDFA(minDfa)
                        : minDfa
                      : null
                  }
                />
              ) : activeTab === 'conversion-steps' && nfaSteps.length > 0 ? (
                <div className="p-6 bg-white dark:bg-gray-900 h-full overflow-y-auto">
                  <h3 className="text-lg font-semibold font-sans text-gray-900 dark:text-gray-100 mb-4">
                    Thompson's Construction Steps
                  </h3>
                  <div className="space-y-6">
                    {nfaSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Step {idx + 1}: {step.description}
                        </h4>
                        <div className="h-48 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 relative">
                          <GraphViewer automaton={step.automaton} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'imported-graph' && importedAutomaton ? (
                <GraphViewer
                  automaton={importedAutomaton}
                  activeStates={simActiveStates}
                />
              ) : activeTab === 'imported-table' && importedAutomaton ? (
                <TransitionTable automaton={importedAutomaton} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  Enter a regular expression to generate automata.
                </div>
              )}
            </div>
          </section>

          <Simulator
            simMode={simMode}
            setSimMode={setSimMode}
            testString={testString}
            setTestString={setTestString}
            simIndex={simIndex}
            simStatus={simStatus}
            stepSimulation={stepSimulation}
            fastForwardSimulation={fastForwardSimulation}
            resetSimulation={resetSimulation}
            batchStrings={batchStrings}
            setBatchStrings={setBatchStrings}
            runBatchTest={runBatchTest}
            batchResults={batchResults}
          />
        </div>

        <section
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm transition-colors duration-200"
          aria-labelledby="ai-prompt-heading"
        >
          <h2
            id="ai-prompt-heading"
            className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100"
          >
            AI Prompt Template
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Copy this prompt to ask an AI (like ChatGPT or Claude) to generate
            regular expressions compatible with this tool:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
              {aiPrompt}
            </pre>
            <button
              onClick={handleCopyPrompt}
              aria-label="Copy AI Prompt to Clipboard"
              className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
