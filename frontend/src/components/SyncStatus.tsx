import { useEffect, useState } from "react";
import { syncService } from "../lib/syncService";
import { Wifi, WifiOff } from "lucide-react";

interface SyncStatusProps {
  tripId?: string;
}

export function SyncStatus({ tripId }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<number>(0);

  // Atualizar estado quando a conexão mudar
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  // Atualizar contagem de ações pendentes periodicamente
  useEffect(() => {
    // Função para atualizar o contador
    const updatePendingCount = () => {
      if (tripId) {
        // Se temos um ID de viagem, verificamos apenas ações para essa viagem
        const hasPending = syncService.hasPendingActions(tripId);
        setPendingActions(hasPending ? 1 : 0);
      } else {
        // Caso contrário, contamos todas as ações pendentes
        const count = syncService.getPendingActionsCount();
        setPendingActions(count);
      }
    };

    // Verificar imediatamente e depois a cada 2 segundos
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);

    return () => clearInterval(interval);
  }, [tripId]);

  // Se não há ações pendentes e estamos online, não mostrar nada
  if (pendingActions === 0 && isOnline) {
    return null;
  }

  return (
    <div
      className={`flex items-center px-3 py-1 rounded-full text-sm ${
        isOnline ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 mr-1" />
          <span>
            {pendingActions > 0
              ? `Sincronizando ${pendingActions} ${
                  pendingActions === 1 ? "item" : "itens"
                }...`
              : "Online"}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 mr-1" />
          <span>
            {pendingActions > 0
              ? `${pendingActions} ${
                  pendingActions === 1 ? "item" : "itens"
                } aguardando conexão`
              : "Offline"}
          </span>
        </>
      )}
    </div>
  );
}
