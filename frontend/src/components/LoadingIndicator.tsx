// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\components\LoadingIndicator.tsx
import { CSSProperties } from "react";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  /**
   * Tamanho do indicador de carregamento
   */
  size?: "small" | "medium" | "large";

  /**
   * Cor do indicador
   */
  color?: "light" | "dark";

  /**
   * Mensagem a ser exibida junto com o indicador
   */
  message?: string;

  /**
   * Classes adicionais para estilização
   */
  className?: string;
}

/**
 * Componente para exibir um indicador de carregamento padronizado
 */
export function LoadingIndicator({
  size = "medium",
  color = "light",
  message,
  className = "",
}: LoadingIndicatorProps) {
  // Determinar o tamanho do ícone com base no prop
  const iconSize = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  }[size];

  // Determinar o estilo com base no prop de cor
  const iconColor = color === "light" ? "text-zinc-200" : "text-zinc-800";

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={`${iconSize} ${iconColor} animate-spin`} />

      {message && (
        <p
          className={`mt-2 text-sm font-medium ${
            color === "light" ? "text-zinc-300" : "text-zinc-800"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
