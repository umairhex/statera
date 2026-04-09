import { Sun, Moon, Github } from 'lucide-react';

const Logo = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const logoPath = isDarkMode
    ? `${import.meta.env.BASE_URL}logos/statera-white-logo.svg`
    : `${import.meta.env.BASE_URL}logos/statera-black-logo.svg`;

  return (
    <img
      src={logoPath}
      alt="Statera Logo"
      width="32"
      height="32"
      aria-hidden="true"
      className="shrink-0 transition-opacity duration-200"
    />
  );
};

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  activeSection: string;
}

export function Header({
  isDarkMode,
  setIsDarkMode,
  activeSection,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo isDarkMode={isDarkMode} />
          <h1 className="text-xl font-semibold tracking-tight">Statera</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <a
            href="#"
            className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none rounded-sm"
            aria-label="View on GitHub"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
      <nav className="px-6 pb-2 flex gap-4 overflow-x-auto scrollbar-hide text-sm font-medium">
        <a
          href="#input-section"
          className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeSection === 'input-section' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
        >
          Input
        </a>
        <a
          href="#automata-section"
          className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeSection === 'automata-section' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
        >
          Automata Views
        </a>
        <a
          href="#simulator-section"
          className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeSection === 'simulator-section' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
        >
          Simulator
        </a>
      </nav>
    </header>
  );
}
