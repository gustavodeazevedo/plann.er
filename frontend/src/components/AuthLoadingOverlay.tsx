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
    "Aguardando resposta do servidor...",
    "O servidor está iniciando...",
    "Preparando sua sessão...",
    "Carregando suas viagens...",
    "Sincronizando dados...",
    "Quase lá...",
  ],
  register: [
    "Criando sua conta...",
    "Conectando com o servidor...",
    "Aguardando resposta do servidor...",
    "O servidor está iniciando...",
    "Configurando seu perfil...",
    "Preparando tudo para você...",
    "Sincronizando dados...",
    "Quase pronto...",
  ],
};

export function AuthLoadingOverlay({
  isLoading,
  type,
}: AuthLoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const messages = loadingMessages[type];

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      setProgress(0);
      return;
    }

    // Trocar mensagem a cada 4 segundos (aumentado de 3 para 4)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);

    // Progresso mais suave e lento
    // Objetivo: chegar em ~90% em 30 segundos, depois avançar muito devagar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) {
          // Primeiros 85%: progresso mais rápido (chega em ~28 segundos)
          return prev + 3;
        } else if (prev < 95) {
          // 85-95%: progresso bem mais lento
          return prev + 0.5;
        } else {
          // Após 95%: praticamente para, mas continua se movendo
          return prev + 0.1;
        }
      });
    }, 1000); // Atualiza a cada segundo

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  // Garantir que o progresso nunca ultrapasse 99% antes de completar
  const displayProgress = Math.min(progress, 99);

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
            Isso pode levar até 30-40 segundos...
          </p>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${displayProgress}%`,
            }}
          />
        </div>

        {/* Porcentagem */}
        <p className="text-zinc-400 text-sm font-mono">
          {Math.round(displayProgress)}%
        </p>

        {/* Dica melhorada */}
        <div className="text-zinc-500 text-xs italic max-w-sm text-center space-y-1">
          <p>
            💡 <strong>Primeira vez ou servidor inativo?</strong>
          </p>
          <p>
            O servidor pode levar de 20 a 40 segundos para "acordar" após
            inatividade. Isso é normal em hospedagens gratuitas!
          </p>
        </div>
      </div>
    </div>
  );
}
