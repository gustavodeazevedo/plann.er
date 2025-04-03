import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { searchLocations, formatLocationResult } from "../lib/opencage";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = "Para onde você vai?",
  className = "",
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce function to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchLocations(value);
          setSuggestions(
            results.map((result) => ({
              id: `${result.geometry.lat},${result.geometry.lng}`,
              text: formatLocationResult(result),
            }))
          );
        } catch (error) {
          console.error("Erro ao buscar sugestões:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [value]);

  // Close suggestions when clicking outside
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

  function handleSelectSuggestion(suggestion: string) {
    onChange(suggestion);
    setSuggestions([]);
    setIsFocused(false);
  }

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2 w-full">
        <MapPin className="size-5 text-zinc-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`bg-transparent text-base sm:text-lg placeholder-zinc-400 outline-none flex-1 min-w-0 ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {isFocused && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-zinc-800 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="px-4 py-2 hover:bg-zinc-700 cursor-pointer text-zinc-200 text-sm"
                onClick={() => handleSelectSuggestion(suggestion.text)}
              >
                {suggestion.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
