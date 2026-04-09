# Statera Copilot Instructions

Statera is an educational visual tool that generates, visualizes, and simulates finite automata (NFA, DFA, and minimized DFA) from regular expressions.

## Quick Reference

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + React Flow + Dagre

**Key Commands:**
- `npm run dev` — Start dev server (HMR, http://localhost:3000)
- `npm run build` — Production build to `dist/` with base path `/statera/`
- `npm run lint` — TypeScript type checking
- `npm run format` — Prettier format all files
- `npm run format:check` — Check formatting without changes

**No test runner configured** — testing would require Jest or Vitest setup.

## Architecture

### Core Concepts

**Thompson's Construction** ([src/lib/automata.ts](src/lib/automata.ts)):
- Regex parser tokenizes patterns (supports `|`, `*`, `+`, `?`, `[]`, `()`)
- Converts to postfix notation (RPN) with operator precedence
- Builds NFA step-by-step using Thompson's construction method
- Generates step objects for visualization
- Computes epsilon closure for DFA conversion
- Minimizes DFA via state subset merging

**State Naming:** Global counter manages state IDs (`q0`, `q1`, …). Always reset when building new automata.

**Symbol Convention:** Epsilon represented as `'ε'` string constant.

### UI Architecture

**Single-page app** with centralized state in [App.tsx](src/App.tsx):
- Automata state: `nfa`, `dfa`, `minDfa` (or null if invalid regex)
- Simulation state: `currentIndex` (position in test string), `activeStates` (set of current states)
- UI mode: `simMode` ('single' or 'batch' string testing)
- Tab navigation: 9+ tab states tracking visible UI section
- Toggle options: `showDeadStates` (hide unreachable states)

**Prop-drilling pattern:** State and callbacks passed to presentational components. No context API or state management library.

### Component Responsibilities

| Component | Purpose | Key Pattern |
|-----------|---------|------------|
| [Header.tsx](src/components/Header.tsx) | Top navigation | Dark mode toggle, GitHub link, logo variant loading |
| [RegexInput.tsx](src/components/RegexInput.tsx) | Regex input field | Error highlighting, example regex buttons |
| [GraphViewer.tsx](src/components/GraphViewer.tsx) | React Flow graph | Dagre layout (LR, 60px nodesep, 100px ranksep), custom edge routing, PNG export |
| [CustomEdge.tsx](src/components/CustomEdge.tsx) | Edge renderer | Handles self-loops, backward edges, bidirectional paths |
| [Simulator.tsx](src/components/Simulator.tsx) | String testing UI | Single or batch mode, step-by-step or fast-forward |
| [TransitionTable.tsx](src/components/TransitionTable.tsx) | Tabular state view | Displays all transitions |
| [FormalDefinition.tsx](src/components/FormalDefinition.tsx) | Math notation | LaTeX-style formal definition display |

## Development Conventions

### Code Style

**Prettier Config** (printWidth=80, singleQuote, trailingComma=es5, arrowParens=always)
- See [.prettierrc](.prettierrc) for details
- Run `npm run format` before committing changes
- Reference: [Prettier Setup](../../memories/repo/prettier-setup.md)

**TypeScript Settings:**
- Target ES2022, JSX=react-jsx, path alias `@/*` for root imports
- Strict mode OFF (`strictNullChecks: false`, `strict: false`)
- Type definitions strongly encouraged but not enforced

**EditorConfig:** UTF-8, LF line endings, 2-space indent (enforced across all files)

### Styling

**Tailwind CSS 4.1** with custom theme:
- Dark mode via `.dark` class on root element
- Inter (sans) and JetBrains Mono (mono) fonts loaded from CSS
- Custom scrollbar styling for both light and dark modes
- React Flow dark mode overrides in [src/index.css](src/index.css)

**Icon Library:** Lucide React (50+ icons used for actions and UI indicators)

### Dark Mode Support

All components must support `.dark:` utilities:
```tsx
// Example from Header.tsx
<div className="dark:bg-slate-900 dark:text-white">
```

Logos use variant loading (black for light, white for dark):
- Reference: [Logo and Favicon Best Practices](../../memories/repo/logo-favicon-best-practices.md)
- Light: `/logos/statera-black-logo.svg`
- Dark: `/logos/statera-white-logo.svg`

## Key Files & Patterns

### File Organization

```
src/
├── App.tsx                    # Root component, centralized state
├── main.tsx                   # React entry point
├── index.css                  # Tailwind + custom theme
├── vite-env.d.ts             # Vite type definitions
├── lib/
│   ├── automata.ts           # Thompson's Construction, NFA/DFA/minDFA
│   └── utils.ts              # Helper utilities
└── components/               # Presentational components (see Component Responsibilities table)
```

### State Persistence

**Import/Export Feature:**
- Automata exported as JSON objects in [App.tsx](src/App.tsx)
- Format: `{ nodes, edges, states, transitions, acceptStates }`
- Used to restore graphs and automata state

### Environment Variables

**Required for AI features:**
```
GEMINI_API_KEY=your-key-here
APP_URL=http://localhost:3000  # For AI Studio deployment
```

**Vite Build:**
- Injects `GEMINI_API_KEY` at build time
- `DISABLE_HMR=true` env var disables hot module replacement if needed

## Common Patterns & Pitfalls

### ✅ When Building Automata

1. **Always reset the global state counter** before building new NFA:
   ```ts
  
   buildNFA(regex); buildNFA(regex2);
   
  
   resetStateCounter?.();
   buildNFA(regex);
   ```

2. **Epsilon transitions are significant** — don't skip them in visualizations
   - Test with `simString(nfa, 'ε')` to verify epsilon closure handling

3. **Dead states** — unreachable states should be hidden by default (`showDeadStates: false`)
   - Improves UX but toggle must be available

### ✅ React Flow Graph Updates

1. **Node layout via Dagre:**
   ```ts
   const direction = 'LR';
   const config = { nodesep: 60, ranksep: 100 };
  
   ```

2. **Custom edge routing** handles:
   - Self-loops (curves back to same node)
   - Backward edges (prevent overlaps)
   - Bidirectional paths (one edge each direction)
   - Reference: [CustomEdge.tsx](src/components/CustomEdge.tsx)

### ❌ Common Mistakes

1. **Forgetting to trim/escape regex input** — user input may have whitespace
2. **Simulation index out of bounds** — validate `currentIndex < testString.length` before advancing
3. **Node mutation in React Flow** — always use `setNodes(nodes => [...nodes, newNode])`
4. **Dark mode CSS missing** — always add `dark:` variants alongside light styles
5. **Favicon path** — use `/favicon.svg` (root-relative), not `./favicon.svg`

## Testing & Debugging

### Manual Testing Checklist

- [ ] Test regex with `(a|b)*c` — validates union and kleene star
- [ ] Test regex with `[a-z]+` — validates character classes
- [ ] Test invalid regex `(a|` — verify error message at correct position
- [ ] Test string simulation with multiple paths (e.g., `(a|b)*` with string `aab`)
- [ ] Test PNG export — verify image quality and formatting
- [ ] Test dark mode toggle — all components respond correctly
- [ ] Test responsive layout — mobile, tablet, desktop viewports

### TypeScript Type Checking

```bash
npm run lint  # Checks without emitting (no .js output)
```

Running type check before committing is recommended to catch errors early.

### Debugging Automata

**Log state transitions:**
```ts
// In automata.ts, add logging to buildNFA/buildDFA
console.log('NFA States:', nfa.states);
console.log('Transitions:', nfa.transitions);
```

**Test epsilon closure:**
```ts
const closure = epsilonClosure(nfa, newSharedState);
console.log('Epsilon closure:', closure);
```

## Deployment

**Base Path:** Production builds use `/statera/` base path (for GitHub Pages or CDN subfolder)

**Build Output:** `dist/` directory contains:
- `index.html` (entry point)
- `assets/` (bundled JS, CSS with Vite hashing)
- All static assets from `public/`

**Environment Secrets:** AI features require `GEMINI_API_KEY` injected at build time via Vite config.

## References & Related Documentation

- **Logo & Favicon Placement:** [Logo and Favicon Best Practices](../../memories/repo/logo-favicon-best-practices.md)
- **Code Formatting:** [Prettier Setup](../../memories/repo/prettier-setup.md)
- **Official Docs:**
  - [React Flow Documentation](https://reactflow.dev/)
  - [Dagre Layout](https://github.com/dagrejs/dagre)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Vite Guide](https://vite.dev/)
