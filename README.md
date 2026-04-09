# Statera ⚖️

> Generate, visualize, and simulate NFA and DFA from Regular Expressions. Fully responsive with an accessible, modern design.

[![GitHub issues](https://img.shields.io/github/issues/umairhex/statera)](https://github.com/umairhex/statera/issues)
[![GitHub stars](https://img.shields.io/github/stars/umairhex/statera)](https://github.com/umairhex/statera/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Statera is a powerful, visual educational tool and playground for finite automata. It allows users to input regular expressions and instantly generates the corresponding Non-deterministic Finite Automaton (NFA), Deterministic Finite Automaton (DFA), and Minimized DFA.

## ✨ Features

- **Regex Parsing:** Supports Union `|`, Kleene Star `*`, One or more `+`, Zero or one `?`, Character classes `[]`, and Grouping `()`.
- **Step-by-Step Generation:** Watch how the NFA is built from the regular expression fragment by fragment.
- **Interactive Graph Visualization:** Beautiful, auto-routing graphs using React Flow and Dagre. Features custom edge routing to prevent line overlaps (handling self-loops, backward edges, and bidirectional edges).
- **String Simulation:** Test strings against the generated automata to see if they are accepted or rejected, with visual path highlighting.
- **Export Capabilities:** Export your generated diagrams as high-quality PNG images.
- **Modern UI/UX:** Fully responsive, accessible design with Dark Mode support, built with Tailwind CSS and Lucide Icons.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/umairhex/statera.git
   cd statera
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 🤖 AI Prompt Template

If you want to use an AI (like ChatGPT or Claude) to generate complex regular expressions compatible with Statera, copy and paste this prompt:

> "Generate a regular expression for [YOUR REQUIREMENT HERE]. Only use the operators: '|' (Union), '\*' (Kleene Star), '+' (One or more), '?' (Zero or one), '[]' (Character classes), and '()' (Grouping). Concatenation should be implicit. Use '\\' to escape literal characters if needed. Do not use advanced regex features like lookaheads, backreferences, or bounded quantifiers like {n,m}."

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Graph Visualization:** [@xyflow/react (React Flow)](https://reactflow.dev/)
- **Graph Layout:** [Dagre](https://github.com/dagrejs/dagre)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Image Export:** [html-to-image](https://github.com/bubkoo/html-to-image)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/umairhex/statera/issues).

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.
