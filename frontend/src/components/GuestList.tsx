import { Edit2, Trash2, User, Share2, X, Plus, Check } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/axios";
import { useNotification } from "./Notification/context";
import { syncService } from "../lib/syncService";

interface Guest {
  name: string;
  accessId: string;
  email?: string;
  confirmed?: boolean;
}

interface GuestListProps {
  tripId: string;
}

export function GuestList({ tripId }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [editingGuest, setEditingGuest] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [shareLink, setShareLink] = useState<{
    guest: Guest;
    shareUrl: string;
  } | null>(null);
  const { showNotification } = useNotification();
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  // Estado para controlar convidados em processo de sincronização (otimistic UI updates)
  const [pendingGuests, setPendingGuests] = useState<{
    [guestId: string]: "add" | "update" | "delete";
  }>({});

  useEffect(() => {
    if (tripId) {
      fetchGuests();

      // Configurar recarregamento periódico a cada 30 segundos
      const intervalId = setInterval(() => {
        // Recarregar apenas se o último carregamento foi há mais de 20 segundos
        if (Date.now() - lastLoadTime > 20000) {
          console.log("[GuestList] Recarregando convidados automaticamente");
          fetchGuests(false);
        }
      }, 30000);

      // Carregar convidados sempre que o tripId mudar ou quando o componente montar
      fetchGuests(true);

      return () => clearInterval(intervalId);
    }
  }, [tripId]);

  const fetchGuests = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    console.log(`[GuestList] Buscando convidados para tripId: ${tripId}`);

    try {
      const response = await api.get(`/trips/${tripId}/guests`);

      if (response.data && response.data.guests) {
        console.log(
          `[GuestList] ${response.data.guests.length} convidados carregados com sucesso`
        );
        setGuests(response.data.guests || []);
      } else {
        console.warn(`[GuestList] Nenhum convidado encontrado na resposta`);
        setGuests([]);
      }

      setLastLoadTime(Date.now());
    } catch (error) {
      console.error("[GuestList] Erro ao carregar convidados:", error);
      if (showLoading) {
        showNotification(
          "Não foi possível carregar a lista de convidados.",
          "error"
        );
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Adicionar novo convidado com suporte a sincronização
  const handleAddGuest = async (e: FormEvent) => {
    e.preventDefault();

    if (!newGuestName.trim()) {
      showNotification("Digite o nome do convidado.", "error");
      return;
    }

    setIsLoading(true);

    // Criar ID temporário para atualização otimista da UI
    const tempId = `temp-${Date.now()}`;
    const tempGuest: Guest = {
      name: newGuestName.trim(),
      accessId: tempId,
    };

    // Atualizar estado local imediatamente (optimistic update)
    setGuests([...guests, tempGuest]);
    setPendingGuests((prev) => ({ ...prev, [tempId]: "add" }));
    setNewGuestName("");

    try {
      // Usar o serviço de sincronização para garantir que o convidado seja salvo
      syncService.addGuest(tripId, newGuestName.trim(), {
        onSuccess: (response: any) => {
          // Remover o convidado temporário e adicionar o real
          setGuests((prevGuests) => {
            const filtered = prevGuests.filter((g) => g.accessId !== tempId);
            return [...filtered, response.guest];
          });

          // Mostrar link de compartilhamento
          setShareLink({
            guest: response.guest,
            shareUrl: response.shareUrl,
          });

          setPendingGuests((prev) => {
            const updated = { ...prev };
            delete updated[tempId];
            return updated;
          });

          showNotification(
            `Convidado ${newGuestName} adicionado com sucesso!`,
            "success"
          );
        },
        onError: (error) => {
          console.error("Erro ao adicionar convidado:", error);
          showNotification(
            "Convidado será adicionado quando a conexão for restabelecida",
            "info"
          );
        },
      });
    } catch (error) {
      console.error("Erro ao adicionar convidado:", error);
      showNotification(
        "Convidado será adicionado quando a conexão for restabelecida",
        "info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar nome do convidado com suporte a sincronização
  const handleUpdateGuest = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingGuest || !editingGuest.name.trim()) {
      showNotification("Digite o nome do convidado.", "error");
      return;
    }

    setIsLoading(true);

    const { id: guestId, name: newName } = editingGuest;

    // Guardar nome antigo para reverter se necessário
    const originalGuest = guests.find((g) => g.accessId === guestId);
    const originalName = originalGuest?.name || "";

    // Atualizar estado local imediatamente (optimistic update)
    setGuests(
      guests.map((guest) =>
        guest.accessId === guestId ? { ...guest, name: newName.trim() } : guest
      )
    );

    setPendingGuests((prev) => ({ ...prev, [guestId]: "update" }));
    setEditingGuest(null);

    try {
      // Usar o serviço de sincronização para garantir que o convidado seja atualizado
      syncService.updateGuest(tripId, guestId, newName.trim(), {
        onSuccess: () => {
          setPendingGuests((prev) => {
            const updated = { ...prev };
            delete updated[guestId];
            return updated;
          });
          showNotification("Convidado atualizado com sucesso!", "success");
        },
        onError: (error) => {
          console.error("Erro ao atualizar convidado:", error);
          showNotification(
            "Alteração será aplicada quando a conexão for restabelecida",
            "info"
          );
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar convidado:", error);
      showNotification(
        "Alteração será aplicada quando a conexão for restabelecida",
        "info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Remover convidado com suporte a sincronização
  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja remover ${guestName} da lista de convidados?`
      )
    ) {
      return;
    }

    // Guardar convidado para reverter se necessário
    const removedGuest = guests.find((g) => g.accessId === guestId);

    // Atualizar estado local imediatamente (optimistic update)
    setGuests(guests.filter((guest) => guest.accessId !== guestId));
    setPendingGuests((prev) => ({ ...prev, [guestId]: "delete" }));

    try {
      // Usar o serviço de sincronização para garantir que o convidado seja removido
      syncService.deleteGuest(tripId, guestId, {
        onSuccess: () => {
          setPendingGuests((prev) => {
            const updated = { ...prev };
            delete updated[guestId];
            return updated;
          });
          showNotification("Convidado removido com sucesso!", "success");
        },
        onError: (error) => {
          console.error("Erro ao remover convidado:", error);
          showNotification(
            "Convidado será removido quando a conexão for restabelecida",
            "info"
          );
        },
      });
    } catch (error) {
      console.error("Erro ao remover convidado:", error);
      showNotification(
        "Convidado será removido quando a conexão for restabelecida",
        "info"
      );
    }
  };

  // Função para gerar link de convite para um convidado específico
  const getGuestShareUrl = (guestId: string, guestName: string) => {
    // Usa o mesmo formato de URL que a API retorna ao adicionar um convidado
    const baseUrl = window.location.origin;
    return `${baseUrl}/trip/guest/${tripId}/${guestId}?name=${encodeURIComponent(
      guestName
    )}`;
  };

  // Função para copiar o link do convidado
  const handleCopyGuestLink = (guestId: string, guestName: string) => {
    const shareUrl = getGuestShareUrl(guestId, guestName);
    navigator.clipboard.writeText(shareUrl);
    showNotification(
      `Link de ${guestName} copiado para a área de transferência!`,
      "success"
    );
  };

  // Função para sincronizar manualmente os convidados
  const syncGuests = () => {
    showNotification("Sincronizando convidados...", "info");
    fetchGuests();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-zinc-300">
            Quem vai participar da viagem
          </h3>
          <button
            onClick={syncGuests}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Sincronizar convidados"
          >
            Sincronizar
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          Adicione os convidados que vão participar da viagem
        </p>
      </div>

      {/* Formulário para adicionar novo convidado */}
      <form
        onSubmit={handleAddGuest}
        className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800"
      >
        <input
          type="text"
          placeholder="Nome do convidado..."
          className="bg-transparent text-zinc-100 placeholder-zinc-500 outline-none flex-1 text-sm p-1"
          value={newGuestName}
          onChange={(e) => setNewGuestName(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-lime-500 hover:bg-lime-400 text-lime-950 rounded-md p-1.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !newGuestName.trim()}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </form>

      {/* Link de compartilhamento quando um novo convidado é adicionado */}
      {shareLink && (
        <div className="p-3 bg-zinc-800 rounded-lg space-y-2 animate-fade-in">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {shareLink.guest.name}
              </p>
              <p className="text-xs text-zinc-400">Link de acesso gerado</p>
            </div>
            <button
              title="Copiar link de convite"
              onClick={() => {
                navigator.clipboard.writeText(shareLink.shareUrl);
                showNotification(
                  "Link copiado para a área de transferência!",
                  "success"
                );
              }}
              className="p-2 hover:bg-zinc-700 rounded transition-colors"
            >
              <Share2 className="size-4 text-zinc-400" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 break-all">
            {shareLink.shareUrl}
          </p>
          <button
            onClick={() => setShareLink(null)}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Formulário para editar convidado */}
      {editingGuest && (
        <form
          onSubmit={handleUpdateGuest}
          className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700 animate-fade-in"
        >
          <input
            type="text"
            placeholder="Nome do convidado..."
            className="bg-transparent text-zinc-100 placeholder-zinc-500 outline-none flex-1 text-sm p-1"
            value={editingGuest.name}
            onChange={(e) =>
              setEditingGuest({ ...editingGuest, name: e.target.value })
            }
            disabled={isLoading}
            autoFocus
          />
          <div className="flex gap-1">
            <button
              type="submit"
              className="bg-lime-500 hover:bg-lime-400 text-lime-950 rounded-md p-1.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !editingGuest.name.trim()}
            >
              <Check size={16} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setEditingGuest(null)}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md p-1.5 flex items-center justify-center"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </form>
      )}

      {/* Lista de convidados */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
        {isLoading && guests.length === 0 ? (
          <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 text-center">
            <p className="text-zinc-500 text-sm">Carregando convidados...</p>
          </div>
        ) : guests.length > 0 ? (
          guests.map((guest) => (
            <div
              key={guest.accessId}
              className={`flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 group ${
                pendingGuests[guest.accessId] ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-zinc-700 rounded-full p-1.5">
                  <User size={14} className="text-zinc-300" />
                </div>

                <div>
                  <p className="text-sm text-zinc-200">
                    {guest.name}
                    {pendingGuests[guest.accessId] === "add" && (
                      <span className="ml-2 text-xs text-zinc-500">
                        (sincronizando...)
                      </span>
                    )}
                    {pendingGuests[guest.accessId] === "update" && (
                      <span className="ml-2 text-xs text-zinc-500">
                        (atualizando...)
                      </span>
                    )}
                  </p>
                  {guest.confirmed && (
                    <span className="text-xs text-lime-400 flex items-center gap-1">
                      <Check size={12} /> Confirmado
                    </span>
                  )}
                </div>
              </div>

              {!editingGuest && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleCopyGuestLink(guest.accessId, guest.name)
                    }
                    className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copiar link de convite"
                    disabled={!!pendingGuests[guest.accessId]}
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setEditingGuest({ id: guest.accessId, name: guest.name })
                    }
                    className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar convidado"
                    disabled={!!pendingGuests[guest.accessId]}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteGuest(guest.accessId, guest.name)
                    }
                    className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover convidado"
                    disabled={!!pendingGuests[guest.accessId]}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 text-center">
            <p className="text-zinc-500 text-sm">Nenhum convidado adicionado</p>
          </div>
        )}
      </div>
    </div>
  );
}
