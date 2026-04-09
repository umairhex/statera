import { useState } from 'react';
import { Automaton } from '../lib/automata';

interface FormalDefinitionProps {
  nfa: Automaton | null;
  dfa: Automaton | null;
  minDfa: Automaton | null;
}

export function FormalDefinition({ nfa, dfa, minDfa }: FormalDefinitionProps) {
  const [type, setType] = useState<'NFA' | 'DFA' | 'Min DFA'>('NFA');
  const automaton = type === 'NFA' ? nfa : type === 'DFA' ? dfa : minDfa;

  if (!automaton) return null;

  const Q = automaton.states.map((s) => s.id).join(', ');
  const Sigma = Array.from(
    new Set(automaton.transitions.map((t) => t.symbol).filter((s) => s !== 'ε'))
  ).join(', ');
  const q0 = automaton.startState;
  const F = automaton.acceptStates.join(', ');

  return (
    <div className="p-6 bg-white dark:bg-gray-900 font-mono text-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-sans text-gray-900 dark:text-gray-100">
          Formal Definition
        </h3>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white block p-2 font-sans"
        >
          {nfa && <option value="NFA">NFA</option>}
          {dfa && <option value="DFA">DFA</option>}
          {minDfa && <option value="Min DFA">Minimized DFA</option>}
        </select>
      </div>
      <div className="space-y-4 text-gray-800 dark:text-gray-200">
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            M = (Q, Σ, δ, q₀, F)
          </strong>
        </div>
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            Q (States):
          </strong>{' '}
          {'{'} {Q} {'}'}
        </div>
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            Σ (Alphabet):
          </strong>{' '}
          {'{'} {Sigma} {'}'}
        </div>
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            q₀ (Start State):
          </strong>{' '}
          {q0}
        </div>
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            F (Accept States):
          </strong>{' '}
          {'{'} {F} {'}'}
        </div>
        <div>
          <strong className="text-gray-900 dark:text-gray-100">
            δ (Transition Function):
          </strong>
          <ul className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {automaton.transitions.length === 0 && (
              <li className="text-gray-500 dark:text-gray-400 italic">
                No transitions
              </li>
            )}
            {automaton.transitions.map((t, i) => (
              <li key={i}>
                δ({t.from}, {t.symbol}) = {t.to}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
