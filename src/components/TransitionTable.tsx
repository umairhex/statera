import { Automaton, EPSILON } from '../lib/automata';

export function TransitionTable({ automaton }: { automaton: Automaton }) {
  const alphabet = Array.from(
    new Set(automaton.transitions.map((t) => t.symbol))
  ).sort();
  if (alphabet.includes(EPSILON)) {
    alphabet.splice(alphabet.indexOf(EPSILON), 1);
    alphabet.push(EPSILON);
  }

  return (
    <div
      className="overflow-x-auto w-full h-full bg-white dark:bg-gray-900 p-4"
      role="region"
      aria-label="State Transition Table Container"
      tabIndex={0}
    >
      <table
        className="min-w-full text-sm text-left border-collapse"
        aria-label="State Transition Table"
      >
        <caption className="sr-only">
          State Transition Table for the generated automaton
        </caption>
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 font-semibold"
            >
              State
            </th>
            {alphabet.map((sym) => (
              <th
                scope="col"
                key={sym}
                className="px-4 py-3 border border-gray-300 dark:border-gray-700 font-semibold text-center"
              >
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {automaton.states.map((state) => {
            const isStart = state.id === automaton.startState;
            const isAccept = state.isAccepting;
            const prefix =
              isStart && isAccept
                ? '→ *'
                : isStart
                  ? '→ '
                  : isAccept
                    ? '* '
                    : '';
            return (
              <tr key={state.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 font-mono font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                  <span
                    className="text-gray-600 dark:text-gray-400 mr-2 w-6 inline-block text-right"
                    aria-hidden="true"
                  >
                    {prefix}
                  </span>
                  {state.label || state.id}
                  {isStart && <span className="sr-only"> (Start State)</span>}
                  {isAccept && (
                    <span className="sr-only"> (Accepting State)</span>
                  )}
                </td>
                {alphabet.map((sym) => {
                  const targets = automaton.transitions
                    .filter((t) => t.from === state.id && t.symbol === sym)
                    .map((t) => t.to);
                  return (
                    <td
                      key={sym}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 font-mono text-center text-gray-800 dark:text-gray-200"
                    >
                      {targets.length > 0 ? (
                        targets.join(', ')
                      ) : (
                        <span
                          className="text-gray-400 dark:text-gray-600"
                          aria-label="No transition"
                        >
                          -
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
