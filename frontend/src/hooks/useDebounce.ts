// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\hooks\useDebounce.ts
import { useState, useEffect } from "react";

/**
 * Hook para implementar debounce em valores
 * Útil para reduzir o número de requisições em inputs de pesquisa, por exemplo
 *
 * @param value O valor a ser debounced
 * @param delay Tempo de espera em milissegundos (padrão: 500ms)
 * @returns O valor após o debounce
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar o timer para atualizar o valor após o delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o timer se o valor mudar antes do delay terminar
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para implementar debounce em funções
 * Útil para reduzir o número de chamadas de funções que são acionadas frequentemente
 *
 * @param callback A função a ser debounced
 * @param delay Tempo de espera em milissegundos (padrão: 500ms)
 * @returns Uma versão debounced da função
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // Limpar o timeout anterior se existir
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Configurar um novo timeout
    const id = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(id);
  };
}
