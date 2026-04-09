export const EPSILON = 'ε';

export type State = { id: string; isAccepting: boolean; label?: string };
export type Transition = { from: string; to: string; symbol: string };
export type Automaton = {
  states: State[];
  transitions: Transition[];
  startState: string;
  acceptStates: string[];
};

class NFAFragment {
  start: State;
  accept: State;
  states: State[];
  transitions: Transition[];
  constructor(
    start: State,
    accept: State,
    states: State[],
    transitions: Transition[]
  ) {
    this.start = start;
    this.accept = accept;
    this.states = states;
    this.transitions = transitions;
  }
}

let stateCounter = 0;
function createState(isAccepting = false): State {
  return { id: `q${stateCounter++}`, isAccepting };
}
export function resetStateCounter() {
  stateCounter = 0;
}

export function tokenize(exp: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < exp.length; i++) {
    if (exp[i] === '[') {
      let j = i;
      while (j < exp.length && exp[j] !== ']') j++;
      if (j === exp.length)
        throw new Error(
          JSON.stringify({ message: 'Unclosed character class', index: i })
        );
      tokens.push(exp.substring(i, j + 1));
      i = j;
    } else if (exp[i] === '\\') {
      if (i + 1 === exp.length)
        throw new Error(
          JSON.stringify({ message: 'Trailing escape character', index: i })
        );
      tokens.push(exp.substring(i, i + 2));
      i++;
    } else {
      tokens.push(exp[i]);
    }
  }
  return tokens;
}

function insertExplicitConcatOperator(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t1 = tokens[i];
    result.push(t1);
    if (i + 1 < tokens.length) {
      const t2 = tokens[i + 1];
      const isT1OperandOrStarPlusQOrRightParen =
        t1 !== '(' && t1 !== '|' && t1 !== '◦';
      const isT2OperandOrLeftParen =
        t2 !== ')' &&
        t2 !== '|' &&
        t2 !== '*' &&
        t2 !== '+' &&
        t2 !== '?' &&
        t2 !== '◦';
      if (isT1OperandOrStarPlusQOrRightParen && isT2OperandOrLeftParen) {
        result.push('◦');
      }
    }
  }
  return result;
}

function getPrecedence(c: string): number {
  switch (c) {
    case '*':
    case '+':
    case '?':
      return 3;
    case '◦':
      return 2;
    case '|':
      return 1;
    default:
      return 0;
  }
}

function toPostfix(tokens: string[]): string[] {
  const postfix: string[] = [];
  const stack: string[] = [];
  const formattedTokens = insertExplicitConcatOperator(tokens);

  for (let i = 0; i < formattedTokens.length; i++) {
    const c = formattedTokens[i];
    if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        postfix.push(stack.pop()!);
      }
      if (stack.length === 0)
        throw new Error(
          JSON.stringify({ message: 'Mismatched parentheses', index: i })
        );
      stack.pop();
    } else if (c === '*' || c === '+' || c === '?') {
      if (i === 0)
        throw new Error(
          JSON.stringify({ message: `Invalid use of '${c}'`, index: i })
        );
      const prev = formattedTokens[i - 1];
      if (prev === '|' || prev === '(' || prev === '◦') {
        throw new Error(
          JSON.stringify({ message: `Invalid use of '${c}'`, index: i })
        );
      }
      postfix.push(c);
    } else if (c === '|' || c === '◦') {
      while (
        stack.length > 0 &&
        getPrecedence(stack[stack.length - 1]) >= getPrecedence(c)
      ) {
        postfix.push(stack.pop()!);
      }
      stack.push(c);
    } else {
      postfix.push(c);
    }
  }

  while (stack.length > 0) {
    const op = stack.pop()!;
    if (op === '(')
      throw new Error(
        JSON.stringify({
          message: 'Mismatched parentheses',
          index: tokens.length - 1,
        })
      );
    postfix.push(op);
  }

  return postfix;
}

export type ConversionStep = {
  description: string;
  automaton: Automaton;
};

export function buildNFASteps(regex: string): ConversionStep[] {
  resetStateCounter();
  if (!regex) return [];

  const tokens = tokenize(regex);
  const postfix = toPostfix(tokens);
  const stack: NFAFragment[] = [];
  const steps: ConversionStep[] = [];

  for (let i = 0; i < postfix.length; i++) {
    const c = postfix[i];
    let description = '';
    if (c === '*') {
      if (stack.length < 1) throw new Error('Invalid');
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: start.id, to: accept.id, symbol: EPSILON },
        { from: frag.accept.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
      description = `Apply Kleene Star (*) to previous fragment`;
    } else if (c === '+') {
      if (stack.length < 1) throw new Error('Invalid');
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
      description = `Apply One or More (+) to previous fragment`;
    } else if (c === '?') {
      if (stack.length < 1) throw new Error('Invalid');
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: start.id, to: accept.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
      description = `Apply Zero or One (?) to previous fragment`;
    } else if (c === '◦') {
      if (stack.length < 2) throw new Error('Invalid');
      const right = stack.pop()!;
      const left = stack.pop()!;
      left.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...left.transitions,
        ...right.transitions,
        { from: left.accept.id, to: right.start.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          left.start,
          right.accept,
          [...left.states, ...right.states],
          transitions
        )
      );
      description = `Concatenate two fragments`;
    } else if (c === '|') {
      if (stack.length < 2) throw new Error('Invalid');
      const right = stack.pop()!;
      const left = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      left.accept.isAccepting = false;
      right.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...left.transitions,
        ...right.transitions,
        { from: start.id, to: left.start.id, symbol: EPSILON },
        { from: start.id, to: right.start.id, symbol: EPSILON },
        { from: left.accept.id, to: accept.id, symbol: EPSILON },
        { from: right.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...left.states, ...right.states],
          transitions
        )
      );
      description = `Union (|) of two fragments`;
    } else {
      const start = createState();
      const accept = createState(true);
      const transitions: Transition[] = [
        { from: start.id, to: accept.id, symbol: c },
      ];
      stack.push(new NFAFragment(start, accept, [start, accept], transitions));
      description = `Create basic fragment for symbol '${c}'`;
    }

    const currentFrag = stack[stack.length - 1];
    steps.push({
      description,
      automaton: {
        states: [...currentFrag.states],
        transitions: [...currentFrag.transitions],
        startState: currentFrag.start.id,
        acceptStates: [currentFrag.accept.id],
      },
    });
  }

  return steps;
}

export function buildNFA(regex: string): Automaton {
  resetStateCounter();
  if (!regex)
    return { states: [], transitions: [], startState: '', acceptStates: [] };

  const tokens = tokenize(regex);
  const postfix = toPostfix(tokens);
  const stack: NFAFragment[] = [];

  for (let i = 0; i < postfix.length; i++) {
    const c = postfix[i];
    if (c === '*') {
      if (stack.length < 1)
        throw new Error(
          JSON.stringify({ message: "Invalid use of '*'", index: -1 })
        );
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: start.id, to: accept.id, symbol: EPSILON },
        { from: frag.accept.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
    } else if (c === '+') {
      if (stack.length < 1)
        throw new Error(
          JSON.stringify({ message: "Invalid use of '+'", index: -1 })
        );
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: frag.start.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
    } else if (c === '?') {
      if (stack.length < 1)
        throw new Error(
          JSON.stringify({ message: "Invalid use of '?'", index: -1 })
        );
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      frag.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...frag.transitions,
        { from: start.id, to: frag.start.id, symbol: EPSILON },
        { from: start.id, to: accept.id, symbol: EPSILON },
        { from: frag.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...frag.states],
          transitions
        )
      );
    } else if (c === '◦') {
      if (stack.length < 2)
        throw new Error(
          JSON.stringify({ message: 'Invalid concatenation', index: -1 })
        );
      const right = stack.pop()!;
      const left = stack.pop()!;
      left.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...left.transitions,
        ...right.transitions,
        { from: left.accept.id, to: right.start.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          left.start,
          right.accept,
          [...left.states, ...right.states],
          transitions
        )
      );
    } else if (c === '|') {
      if (stack.length < 2)
        throw new Error(
          JSON.stringify({ message: "Invalid union '|'", index: -1 })
        );
      const right = stack.pop()!;
      const left = stack.pop()!;
      const start = createState();
      const accept = createState(true);
      left.accept.isAccepting = false;
      right.accept.isAccepting = false;
      const transitions: Transition[] = [
        ...left.transitions,
        ...right.transitions,
        { from: start.id, to: left.start.id, symbol: EPSILON },
        { from: start.id, to: right.start.id, symbol: EPSILON },
        { from: left.accept.id, to: accept.id, symbol: EPSILON },
        { from: right.accept.id, to: accept.id, symbol: EPSILON },
      ];
      stack.push(
        new NFAFragment(
          start,
          accept,
          [start, accept, ...left.states, ...right.states],
          transitions
        )
      );
    } else {
      const start = createState();
      const accept = createState(true);
      const transitions: Transition[] = [
        { from: start.id, to: accept.id, symbol: c },
      ];
      stack.push(new NFAFragment(start, accept, [start, accept], transitions));
    }
  }

  if (stack.length !== 1)
    throw new Error(
      JSON.stringify({ message: 'Invalid regular expression', index: -1 })
    );
  const finalFrag = stack.pop()!;
  return {
    states: finalFrag.states,
    transitions: finalFrag.transitions,
    startState: finalFrag.start.id,
    acceptStates: [finalFrag.accept.id],
  };
}

export function matchSymbol(char: string, symbol: string): boolean {
  if (symbol === EPSILON) return false;
  if (symbol.startsWith('[') && symbol.endsWith(']')) {
    try {
      return new RegExp(`^${symbol}$`).test(char);
    } catch {
      return char === symbol;
    }
  }
  if (symbol.startsWith('\\')) {
    try {
      return new RegExp(`^${symbol}$`).test(char);
    } catch {
      return char === symbol[1];
    }
  }
  return char === symbol;
}

export function epsilonClosure(
  states: string[],
  transitions: Transition[]
): string[] {
  const closure = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    const state = stack.pop()!;
    const epsilonTransitions = transitions.filter(
      (t) => t.from === state && t.symbol === EPSILON
    );
    for (const t of epsilonTransitions) {
      if (!closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return Array.from(closure).sort();
}

export function move(
  states: string[],
  char: string,
  transitions: Transition[]
): string[] {
  const result = new Set<string>();
  for (const state of states) {
    const activeTransitions = transitions.filter(
      (t) => t.from === state && matchSymbol(char, t.symbol)
    );
    for (const t of activeTransitions) {
      result.add(t.to);
    }
  }
  return Array.from(result).sort();
}

export function buildDFA(nfa: Automaton): Automaton {
  if (nfa.states.length === 0) return nfa;
  const dfaStates: State[] = [];
  const dfaTransitions: Transition[] = [];
  const alphabet = new Set<string>();
  nfa.transitions.forEach((t) => {
    if (t.symbol !== EPSILON) alphabet.add(t.symbol);
  });

  const startClosure = epsilonClosure([nfa.startState], nfa.transitions);
  const startStateId = startClosure.join(',');
  const isAccepting = (states: string[]) =>
    states.some((s) => nfa.acceptStates.includes(s));

  const unmarkedStates = [startClosure];
  const dfaStateMap = new Map<string, string[]>();
  dfaStateMap.set(startStateId, startClosure);

  let dfaStateCounter = 0;
  const getDfaStateId = (id: string) => `S${id}`;
  const stateIdMapping = new Map<string, string>();
  stateIdMapping.set(startStateId, getDfaStateId(dfaStateCounter.toString()));
  dfaStateCounter++;

  dfaStates.push({
    id: stateIdMapping.get(startStateId)!,
    isAccepting: isAccepting(startClosure),
    label: startStateId,
  });

  const markedStates = new Set<string>();

  while (unmarkedStates.length > 0) {
    const currentClosure = unmarkedStates.shift()!;
    const currentId = currentClosure.join(',');
    markedStates.add(currentId);

    for (const symbol of alphabet) {
      const moveResult = new Set<string>();
      for (const state of currentClosure) {
        const activeTransitions = nfa.transitions.filter(
          (t) => t.from === state && t.symbol === symbol
        );
        for (const t of activeTransitions) moveResult.add(t.to);
      }
      if (moveResult.size === 0) continue;

      const nextClosure = epsilonClosure(
        Array.from(moveResult),
        nfa.transitions
      );
      const nextId = nextClosure.join(',');

      if (!dfaStateMap.has(nextId)) {
        dfaStateMap.set(nextId, nextClosure);
        unmarkedStates.push(nextClosure);
        stateIdMapping.set(nextId, getDfaStateId(dfaStateCounter.toString()));
        dfaStateCounter++;
        dfaStates.push({
          id: stateIdMapping.get(nextId)!,
          isAccepting: isAccepting(nextClosure),
          label: nextId,
        });
      }
      dfaTransitions.push({
        from: stateIdMapping.get(currentId)!,
        to: stateIdMapping.get(nextId)!,
        symbol,
      });
    }
  }

  return {
    states: dfaStates,
    transitions: dfaTransitions,
    startState: stateIdMapping.get(startStateId)!,
    acceptStates: dfaStates.filter((s) => s.isAccepting).map((s) => s.id),
  };
}

export function minimizeDFA(dfa: Automaton): Automaton {
  if (dfa.states.length === 0) return dfa;

  const reachable = new Set<string>([dfa.startState]);
  const queue = [dfa.startState];
  while (queue.length > 0) {
    const state = queue.shift()!;
    for (const t of dfa.transitions) {
      if (t.from === state && !reachable.has(t.to)) {
        reachable.add(t.to);
        queue.push(t.to);
      }
    }
  }

  const reachableStates = dfa.states.filter((s) => reachable.has(s.id));
  const reachableTransitions = dfa.transitions.filter(
    (t) => reachable.has(t.from) && reachable.has(t.to)
  );
  const reachableAccept = dfa.acceptStates.filter((s) => reachable.has(s));

  let partitions: Set<string>[] = [];
  const acceptSet = new Set(reachableAccept);
  const nonAcceptSet = new Set(
    reachableStates.map((s) => s.id).filter((id) => !acceptSet.has(id))
  );

  if (acceptSet.size > 0) partitions.push(acceptSet);
  if (nonAcceptSet.size > 0) partitions.push(nonAcceptSet);

  const alphabet = Array.from(
    new Set(reachableTransitions.map((t) => t.symbol))
  );

  let changed = true;
  while (changed) {
    changed = false;
    const newPartitions: Set<string>[] = [];

    for (const group of partitions) {
      const splits = new Map<string, Set<string>>();

      for (const state of group) {
        const signature = alphabet
          .map((sym) => {
            const target = reachableTransitions.find(
              (t) => t.from === state && t.symbol === sym
            )?.to;
            if (!target) return '-1';
            const targetPartitionIndex = partitions.findIndex((p) =>
              p.has(target)
            );
            return `${sym}:${targetPartitionIndex}`;
          })
          .join('|');

        if (!splits.has(signature)) {
          splits.set(signature, new Set());
        }
        splits.get(signature)!.add(state);
      }

      for (const splitGroup of splits.values()) {
        newPartitions.push(splitGroup);
      }
      if (splits.size > 1) {
        changed = true;
      }
    }
    partitions = newPartitions;
  }

  const newStates: State[] = [];
  const newTransitions: Transition[] = [];
  let newStartState = '';
  const newAcceptStates: string[] = [];

  const getGroupId = (stateId: string) => {
    const idx = partitions.findIndex((p) => p.has(stateId));
    return `M${idx}`;
  };

  partitions.forEach((group, idx) => {
    const id = `M${idx}`;
    const isStart = group.has(dfa.startState);
    const isAccept = Array.from(group).some((s) => acceptSet.has(s));

    newStates.push({
      id,
      isAccepting: isAccept,
      label: Array.from(group).join(','),
    });

    if (isStart) newStartState = id;
    if (isAccept) newAcceptStates.push(id);

    const rep = Array.from(group)[0];
    for (const sym of alphabet) {
      const target = reachableTransitions.find(
        (t) => t.from === rep && t.symbol === sym
      )?.to;
      if (target) {
        newTransitions.push({
          from: id,
          to: getGroupId(target),
          symbol: sym,
        });
      }
    }
  });

  return {
    states: newStates,
    transitions: newTransitions,
    startState: newStartState,
    acceptStates: newAcceptStates,
  };
}

export function makeCompleteDFA(dfa: Automaton): Automaton {
  if (dfa.states.length === 0) return dfa;

  const alphabet = new Set<string>();
  dfa.transitions.forEach((t) => {
    if (t.symbol !== EPSILON) alphabet.add(t.symbol);
  });

  const newTransitions = [...dfa.transitions];
  let deadStateId = 'Dead';
  let needsDeadState = false;

  for (const state of dfa.states) {
    const stateTransitions = newTransitions.filter((t) => t.from === state.id);
    const stateSymbols = new Set(stateTransitions.map((t) => t.symbol));

    for (const symbol of alphabet) {
      if (!stateSymbols.has(symbol)) {
        needsDeadState = true;
        newTransitions.push({ from: state.id, to: deadStateId, symbol });
      }
    }
  }

  if (!needsDeadState) return dfa;

  for (const symbol of alphabet) {
    newTransitions.push({ from: deadStateId, to: deadStateId, symbol });
  }

  const newStates = [
    ...dfa.states,
    { id: deadStateId, isAccepting: false, label: 'Dead' },
  ];

  return {
    ...dfa,
    states: newStates,
    transitions: newTransitions,
  };
}
