import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    console.log("🎨 Tema armazenado:", stored);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    // PADRÃO: light
    return "light";
  });

  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    try {
      const root = document.documentElement;
      console.log("🎨 Aplicando tema:", theme);
      
      // Remove ambas as classes
      root.classList.remove("light", "dark");
      
      // Adiciona a classe do tema atual
      root.classList.add(theme);
      
      // Salva no localStorage
      localStorage.setItem("theme", theme);
      
      console.log("✅ Classes do HTML:", root.className);
      setIsThemeReady(true);
    } catch (error) {
      console.error("❌ Erro ao aplicar tema:", error);
      setIsThemeReady(true);
    }
  }, [theme]);

  const toggleTheme = () => {
    console.log("🔄 Toggle tema de:", theme);
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      console.log("➡️ Novo tema:", newTheme);
      return newTheme;
    });
  };

  if (!isThemeReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}
