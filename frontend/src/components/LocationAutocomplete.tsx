import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { opencage, OpenCageResult } from "../lib/opencage";
import { useDebounce, useDebouncedCallback } from "../hooks/useDebounce";
import { ErrorDisplay } from "./ErrorDisplay";
import { useErrorHandler } from "../utils/errorHandler";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onSelect?: (locationData: {
    text: string;
    coordinates?: [number, number];
  }) => void;
}

interface Suggestion {
  id: string;
  text: string;
  coordinates?: [number, number];
}

export function LocationAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = "Para onde você vai?",
  className = "",
  onSelect,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { handleError } = useErrorHandler();
  const [hasShownFallbackWarning, setHasShownFallbackWarning] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>("");

  // Aumentar o tempo de debounce para 350ms para ter uma boa experiência do usuário
  const debouncedValue = useDebounce(value, 350);

  // Verificar se estamos usando o fallback e mostrar aviso apenas uma vez
  useEffect(() => {
    if (!hasShownFallbackWarning && opencage.isUsingFallbackKey()) {
      console.warn(
        "Usando API key de fallback para o OpenCage. Isso deve ser usado apenas para desenvolvimento."
      );
      setHasShownFallbackWarning(true);

      // Limpar cache ao iniciar se estiver usando fallback
      opencage.clearCache();
    }
  }, [hasShownFallbackWarning]);

  // Limpar o cache quando o componente for montado para garantir resultados frescos
  useEffect(() => {
    opencage.clearCache();
  }, []);

  // Função para buscar sugestões com tratamento de erro aprimorado
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      // Se for a mesma consulta, não busque novamente
      if (query === lastQuery && suggestions.length > 0) {
        return;
      }

      setLastQuery(query);
      setIsLoading(true);
      setError(null);

      try {
        // Verificar se a API está configurada
        if (!opencage.isConfigured()) {
          console.error(
            "[LocationAutocomplete] API OpenCage não configurada corretamente"
          );
          setError("Serviço de localização não disponível no momento");
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        const results = await opencage.searchLocation(query);

        // Se a API retornou resultados vazios mas sem erro, pode ser uma consulta inválida
        if (results.length === 0) {
          console.log(
            `[LocationAutocomplete] Nenhum resultado encontrado para "${query}"`
          );
          setSuggestions([]);
          return;
        }

        // Mapear resultados para as sugestões com tratamento adequado
        const formattedSuggestions = results.map((result) => {
          const formattedText = opencage.formatLocationResult(result);

          // Garantir que temos um texto para exibir (fallback para a string formatada completa)
          const displayText = formattedText || result.formatted || query;

          return {
            id: `${result.geometry.lat},${result.geometry.lng}`,
            text: displayText,
            coordinates: [result.geometry.lat, result.geometry.lng] as [
              number,
              number
            ],
          };
        });

        // Filtrar qualquer sugestão sem texto e remover duplicatas
        const uniqueSuggestions =
          removeDuplicateSuggestions(formattedSuggestions);

        setSuggestions(uniqueSuggestions);
      } catch (error) {
        handleError(error, {
          context: "buscar localizações",
          fallbackMessage:
            "Não foi possível carregar as sugestões de localização",
          showNotification: false, // Não mostrar notificação global, apenas no componente
        });

        setError("Erro ao buscar sugestões. Tente novamente.");
        setSuggestions([]);
        console.error(
          "[LocationAutocomplete] Erro ao buscar sugestões:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, lastQuery, suggestions.length]
  );

  // Função para remover sugestões duplicadas baseado no texto
  const removeDuplicateSuggestions = (
    suggestions: Suggestion[]
  ): Suggestion[] => {
    const uniqueTexts = new Set<string>();
    return suggestions.filter((s) => {
      if (!s.text || uniqueTexts.has(s.text)) return false;
      uniqueTexts.add(s.text);
      return true;
    });
  };

  // Usar debounced callback para pesquisa manual
  const debouncedFetchSuggestions = useDebouncedCallback(fetchSuggestions, 350);

  // Buscar sugestões quando o valor debounced mudar
  useEffect(() => {
    if (debouncedValue && debouncedValue.trim().length >= 2) {
      fetchSuggestions(debouncedValue);
    } else {
      setSuggestions([]);
    }
  }, [debouncedValue, fetchSuggestions]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manipular seleção de sugestão
  const handleSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      onChange(suggestion.text);

      if (onSelect) {
        onSelect({
          text: suggestion.text,
          coordinates: suggestion.coordinates,
        });
      }

      setSuggestions([]);
      setIsFocused(false);

      // Remove foco do input após selecionar
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    [onChange, onSelect]
  );

  // Manipular mudança no input
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Mostrar lista de sugestões quando o usuário começa a digitar
      if (!isFocused && newValue.trim().length >= 2) {
        setIsFocused(true);
      }

      // Para consultas curtas, limpar as sugestões imediatamente
      if (newValue.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      // Iniciar busca com debounce
      debouncedFetchSuggestions(newValue);
    },
    [onChange, debouncedFetchSuggestions, isFocused]
  );

  // Melhorar acessibilidade com navegação por teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Se não temos sugestões ou não estamos focados, não fazemos nada
      if (!isFocused || suggestions.length === 0) return;

      // Implementar navegação por teclado nas sugestões
      if (e.key === "Escape") {
        setSuggestions([]);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    },
    [isFocused, suggestions]
  );

  // Memorizar a lista de sugestões renderizada
  const suggestionsList = useMemo(() => {
    if (!isFocused || suggestions.length === 0) {
      return null;
    }

    return (
      <div
        ref={suggestionsRef}
        className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-h-60 overflow-auto border border-zinc-200 dark:border-zinc-700"
        role="listbox"
        id="location-suggestions"
      >
        <ul className="py-1">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-zinc-900 dark:text-zinc-200 text-sm"
              onClick={() => handleSelectSuggestion(suggestion)}
              role="option"
            >
              {suggestion.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }, [isFocused, suggestions, handleSelectSuggestion]);

  return (
    <div className="relative flex-1">
      <div
        className={`flex items-center gap-2 w-full ${
          disabled ? "opacity-70" : ""
        }`}
      >
        <MapPin className="size-5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`bg-transparent text-base sm:text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 outline-none flex-1 min-w-0 ${className}`}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-autocomplete="list"
          aria-controls={isFocused ? "location-suggestions" : undefined}
          aria-expanded={isFocused && suggestions.length > 0}
          aria-haspopup="listbox"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 animate-spin" />
        )}
      </div>

      {error && (
        <ErrorDisplay
          message={error}
          variant="error"
          className="mt-2"
          onDismiss={() => setError(null)}
        />
      )}

      {suggestionsList}
    </div>
  );
}
