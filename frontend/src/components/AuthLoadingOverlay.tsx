import { Loader2, Plane } from "lucide-react";
import { useEffect, useState } from "react";

interface AuthLoadingOverlayProps {
  isLoading: boolean;
  type: "login" | "register";
}

const loadingMessages = {
  login: [
    "Verificando suas credenciais...",
    "Conectando com o servidor...",
    "Preparando sua sessão...",
    "Carregando suas viagens...",
    "Quase lá...",
  ],
  register: [
    "Criando sua conta...",
    "Conectando com o servidor...",
    "Configurando seu perfil...",
    "Preparando tudo para você...",
    "Quase pronto...",
  ],
};

export function AuthLoadingOverlay({
  isLoading,
  type,
}: AuthLoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = loadingMessages[type];

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }

    // Trocar mensagem a cada 3 segundos
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        {/* Logo animado */}
        <div className="relative">
          <div className="absolute inset-0 bg-lime-400/20 blur-2xl rounded-full animate-pulse" />
          <Plane className="w-16 h-16 text-lime-400 animate-bounce" />
        </div>

        {/* Spinner */}
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />

        {/* Mensagem contextual */}
        <div className="text-center space-y-2">
          <p className="text-zinc-100 text-lg font-medium animate-pulse">
            {messages[messageIndex]}
          </p>
          <p className="text-zinc-400 text-sm">
            Isso pode levar alguns segundos...
          </p>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-400 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((messageIndex + 1) / messages.length) * 100}%`,
            }}
          />
        </div>

        {/* Dica */}
        <p className="text-zinc-500 text-xs italic max-w-sm text-center">
          💡 Dica: O servidor pode estar "acordando" após inatividade. Isso é
          normal em hospedagens gratuitas!
        </p>
      </div>
    </div>
  );
}
