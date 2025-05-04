import { Check, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Notification({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000,
}: NotificationProps) {
  const [animationState, setAnimationState] = useState<
    "entering" | "visible" | "exiting" | "hidden"
  >("hidden");

  // Gerenciar transições de estados de animação
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isVisible && animationState === "hidden") {
      // Inicia a animação de entrada
      setAnimationState("entering");

      // Após a animação de entrada, muda para "visible"
      timeoutId = setTimeout(() => {
        setAnimationState("visible");
      }, 300); // Duração da animação de entrada
    } else if (
      !isVisible &&
      (animationState === "entering" || animationState === "visible")
    ) {
      // Inicia a animação de saída
      setAnimationState("exiting");

      // Após a animação de saída, muda para "hidden"
      timeoutId = setTimeout(() => {
        setAnimationState("hidden");
      }, 300); // Duração da animação de saída
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, animationState]);

  // Auto-fechamento da notificação
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isVisible && duration > 0) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, duration, onClose]);

  // Se estiver completamente escondido, não renderiza nada
  if (animationState === "hidden") return null;

  // Classes de animação baseadas no estado atual
  const animationClasses = {
    entering: "translate-y-0 opacity-100",
    visible: "translate-y-0 opacity-100",
    exiting: "translate-y-2 opacity-0",
  }[animationState];

  return (
    <div
      className={`fixed top-6 right-6 z-50 max-w-md transform transition-all duration-300 ease-in-out ${animationClasses}`}
      role="alert"
    >
      <div
        className={`
          flex items-start gap-3 p-4 rounded-lg shadow-lg border 
          ${
            type === "success"
              ? "bg-lime-50 border-lime-300 text-lime-900"
              : type === "error"
              ? "bg-red-50 border-red-300 text-red-900"
              : "bg-zinc-50 border-zinc-300 text-zinc-900"
          }
        `}
      >
        <div className="flex-shrink-0 mt-0.5">
          {type === "success" ? (
            <div className="bg-lime-400 rounded-full p-1">
              <Check size={16} className="text-lime-50" />
            </div>
          ) : type === "error" ? (
            <div className="bg-red-400 rounded-full p-1">
              <X size={16} className="text-red-50" />
            </div>
          ) : (
            <div className="bg-zinc-400 rounded-full p-1">
              <Check size={16} className="text-zinc-50" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 text-zinc-500 hover:text-zinc-700 transition-colors"
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
