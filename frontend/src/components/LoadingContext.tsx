import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { LoadingIndicator } from "./LoadingIndicator";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  // Incremente o contador de carregamento e mostre o indicador
  const startLoading = useCallback(() => {
    setLoadingCount((prev) => {
      const newCount = prev + 1;
      setIsLoading(true);
      return newCount;
    });
  }, []);

  // Decremente o contador e oculte o indicador apenas quando todas as operações terminarem
  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount <= 0) {
        setIsLoading(false);
        return 0;
      }
      return newCount;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      {isLoading && <LoadingIndicator />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading deve ser usado dentro de um LoadingProvider");
  }
  return context;
}
