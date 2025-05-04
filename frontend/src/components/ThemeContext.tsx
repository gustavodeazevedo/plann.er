import React, { createContext, useContext, useEffect, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Detectar inicialmente o tema do sistema como fallback
  const getInitialTheme = (): Theme => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }

      // Se não tiver tema salvo, verifica preferência do sistema
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }

      return "light";
    } catch (error) {
      console.error("Erro ao detectar tema inicial:", error);
      return "light"; // Tema padrão em caso de erro
    }
  };

  const [theme, setTheme] = useLocalStorage<Theme>("theme", getInitialTheme());
  const [isThemeReady, setIsThemeReady] = useState(false);

  // Aplica o tema ao elemento HTML root
  useEffect(() => {
    try {
      const root = window.document.documentElement;

      // Remove classes anteriores
      root.classList.remove("light", "dark");

      // Adiciona a classe de tema atual
      root.classList.add(theme);

      setIsThemeReady(true);
    } catch (error) {
      console.error("Erro ao aplicar tema:", error);
      setIsThemeReady(true); // Continua a renderização mesmo com erro
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Renderizar o conteúdo mesmo que o tema ainda não esteja pronto
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fornecer um valor padrão em vez de lançar um erro
    return { theme: "light", toggleTheme: () => {} };
  }
  return context;
};
