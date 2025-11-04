import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800/50 dark:bg-zinc-700/50 hover:bg-zinc-700/70 dark:hover:bg-zinc-600/70 transition-all duration-300 group border border-zinc-700/50 dark:border-zinc-600/50"
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label="Alternar tema"
    >
      {/* Ícone do Sol (Modo Claro) */}
      <Sun
        className={`absolute size-5 text-amber-400 transition-all duration-300 ${
          theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        }`}
      />

      {/* Ícone da Lua (Modo Escuro) */}
      <Moon
        className={`absolute size-5 text-blue-400 transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />

      {/* Efeito de glow ao hover */}
      <span
        className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          theme === "dark"
            ? "bg-blue-400/10 shadow-lg shadow-blue-400/20"
            : "bg-amber-400/10 shadow-lg shadow-amber-400/20"
        }`}
      />
    </button>
  );
}
