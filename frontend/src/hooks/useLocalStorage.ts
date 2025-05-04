import { useState, useEffect } from "react";

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Estado para armazenar nosso valor
  // Passe a função de estado inicial para useState para que a lógica seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Obter do localStorage pelo key
      const item = window.localStorage.getItem(key);

      // Verificar se o item existe e não está vazio
      if (!item) return initialValue;

      try {
        // Tentar analisar o JSON
        return JSON.parse(item);
      } catch (parseError) {
        // Se não conseguir analisar o JSON, remover o item inválido e retornar o valor inicial
        console.error(
          `Erro ao analisar item do localStorage (${key}):`,
          parseError
        );
        window.localStorage.removeItem(key);
        return initialValue;
      }
    } catch (error) {
      // Se ocorrer erro ao acessar localStorage, retorna o valor inicial
      console.error(`Erro ao acessar localStorage (${key}):`, error);
      return initialValue;
    }
  });

  // Retorna uma versão envolvida da função setter do useState que
  // persiste o novo valor para localStorage.
  const setValue = (value: React.SetStateAction<T>) => {
    try {
      // Permitir que o valor seja uma função para que tenhamos a mesma API que useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Salvar estado
      setStoredValue(valueToStore);
      // Salvar para localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Registrar erro sem quebrar a UI
      console.error(`Erro ao salvar no localStorage (${key}):`, error);
    }
  };

  // Sincronizar com outros possíveis localstorage da mesma página
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (parseError) {
          console.error(
            `Erro ao sincronizar mudança de localStorage (${key}):`,
            parseError
          );
          // Não atualiza o estado com valores inválidos
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
