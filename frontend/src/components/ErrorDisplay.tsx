// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\components\ErrorDisplay.tsx
import { XCircle, AlertTriangle, Info, X } from "lucide-react";
import { ReactNode } from "react";

interface ErrorDisplayProps {
  /**
   * Mensagem de erro ou elemento React a ser exibido
   */
  message: string | ReactNode;

  /**
   * Variante visual do erro
   */
  variant?: "error" | "warning" | "info";

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Função chamada quando o usuário fecha o alerta
   */
  onDismiss?: () => void;

  /**
   * Se verdadeiro, o componente será renderizado em um formato compacto
   */
  compact?: boolean;
}

/**
 * Componente para exibir mensagens de erro/alerta padronizadas
 */
export function ErrorDisplay({
  message,
  variant = "error",
  className = "",
  onDismiss,
  compact = false,
}: ErrorDisplayProps) {
  // Configurações visuais com base na variante
  const config = {
    error: {
      bgColor: "bg-red-900/50",
      borderColor: "border-red-700",
      textColor: "text-red-200",
      icon: <XCircle className="size-5 text-red-400 flex-shrink-0" />,
    },
    warning: {
      bgColor: "bg-amber-900/50",
      borderColor: "border-amber-700",
      textColor: "text-amber-200",
      icon: <AlertTriangle className="size-5 text-amber-400 flex-shrink-0" />,
    },
    info: {
      bgColor: "bg-blue-900/50",
      borderColor: "border-blue-700",
      textColor: "text-blue-200",
      icon: <Info className="size-5 text-blue-400 flex-shrink-0" />,
    },
  };

  const { bgColor, borderColor, textColor, icon } = config[variant];

  return (
    <div
      className={`${bgColor} ${borderColor} ${textColor} border rounded-lg p-3 ${
        compact ? "py-2" : "p-3"
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        {!compact && icon}

        <div className="flex-1">
          {typeof message === "string" ? (
            <p className={`${textColor} ${compact ? "text-xs" : "text-sm"}`}>
              {message}
            </p>
          ) : (
            message
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${textColor} hover:text-white transition-colors flex-shrink-0`}
            aria-label="Fechar"
          >
            <X className={compact ? "size-3" : "size-4"} />
          </button>
        )}
      </div>
    </div>
  );
}
