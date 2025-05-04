import {
  ArrowRight,
  Calendar,
  LogOut,
  MapPin,
  Settings2,
  Share2,
  User,
  X,
  FileText,
} from "lucide-react";
import { FormEvent, useCallback } from "react";
import { StarButton } from "./components/StarButton";
import { LocationAutocomplete } from "./components/LocationAutocomplete";
import { DatePicker } from "./components/DatePicker";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./components/Notification/context";
import "./styles/app.css";
import "./styles/datepicker.css";
import { StableTaskList } from "./components/StableTaskList";
import { GuestList } from "./components/GuestList";
import { SyncStatus } from "./components/SyncStatus";
import { useTripState } from "./hooks/useTripState";
import { useGuests } from "./hooks/useGuests";
import { useAuth } from "./hooks/useAuth";
import { TicketUpload } from "./components/TicketUpload";

interface ShareLink {
  shareUrl: string;
  guest: {
    name: string;
    accessId: string;
  };
}

export function App() {
  const {
    destination,
    setDestination,
    date,
    setDate,
    isLoading,
    createdTripId,
    isGuestsInputOpen,
    isTaskListOpen,
    isTicketUploadOpen,
    openGuestsInput,
    closeGuestsInput,
    openTaskList,
    closeTaskList,
    openTicketUpload,
    closeTicketUpload,
    startNewTrip,
    handleSaveTrip,
    setIsEditing,
    isEditing,
  } = useTripState();

  const {
    isGuestsModalOpen,
    shareLink,
    openGuestsModal,
    closeGuestsModal,
    addNewGuest,
  } = useGuests();

  const { user, handleLogout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Função para alternar o modo de edição de local/data
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // Estamos saindo do modo de edição, precisamos salvar as alterações
      if (destination && date && createdTripId) {
        handleSaveTrip(true); // Salvar as alterações como rascunho
      }
    }

    setIsEditing(!isEditing);
  }, [
    isEditing,
    destination,
    date,
    createdTripId,
    handleSaveTrip,
    setIsEditing,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-pattern bg-no-repeat bg-center">
      {user && (
        <div className="w-full">
          <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 text-center">
            <div className="flex justify-between items-center">
              <span className="text-xl sm:text-2xl font-medium welcome-text">
                Olá, {user.name}
              </span>
              {createdTripId && (
                <button
                  onClick={startNewTrip}
                  className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  Iniciar nova viagem
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4 sm:p-0">
        <div className="max-w-3xl w-full px-4 sm:px-6 text-center space-y-6 sm:space-y-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <img src="/logo.svg" alt="plann.er" className="w-32 sm:w-auto" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <LogOut className="size-4 sm:size-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
            <p className="text-zinc-300 text-base sm:text-lg">
              Convide seus amigos e planeje sua próxima viagem!
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Seção 1: Destino e Data */}
            <div className="h-auto sm:h-16 bg-zinc-900 p-3 sm:px-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center shadow-shape gap-3">
              <LocationAutocomplete
                disabled={!isEditing && (isGuestsInputOpen || isTaskListOpen)}
                value={destination}
                onChange={setDestination}
              />

              <DatePicker
                disabled={!isEditing && (isGuestsInputOpen || isTaskListOpen)}
                value={date}
                onChange={setDate}
                className="w-full sm:w-40"
              />

              <div className="hidden sm:block w-px h-6 bg-zinc-800" />

              {isGuestsInputOpen || isTaskListOpen ? (
                <button
                  onClick={toggleEditMode}
                  className="bg-zinc-800 text-zinc-200 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                >
                  <span className="sm:hidden">
                    {isEditing ? "Concluir" : "Alterar"}
                  </span>
                  <span className="hidden sm:inline">
                    {isEditing ? "Concluir edição" : "Alterar local/data"}
                  </span>
                  <Settings2 className="size-4 sm:size-5" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!destination || !date) {
                      showNotification(
                        "Preencha o destino e a data antes de continuar!",
                        "error"
                      );
                      return;
                    }
                    const trip = await handleSaveTrip(true);
                    if (trip) {
                      openTaskList();
                    }
                  }}
                  className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Continuar"}
                  <ArrowRight className="size-4 sm:size-5" />
                </button>
              )}
            </div>

            {/* Seção 2: Lista de Itens (visível quando isTaskListOpen for true) */}
            {createdTripId && isTaskListOpen && (
              <div className="bg-zinc-900 p-4 rounded-xl shadow-shape">
                <StableTaskList tripId={createdTripId} />

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={openGuestsInput}
                    className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 transition-colors"
                  >
                    Confirmar Itens
                    <ArrowRight className="size-4 sm:size-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Seção 3: Botão de Adicionar Convidados */}
            {isGuestsInputOpen && (
              <div className="h-auto sm:h-16 bg-zinc-900 p-3 sm:px-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center shadow-shape gap-3">
                <button
                  type="button"
                  onClick={openGuestsModal}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <User className="size-5 text-zinc-400 flex-shrink-0" />
                  <span className="text-zinc-400 text-base sm:text-lg flex-1">
                    Adicionar convidado
                  </span>
                </button>

                <div className="hidden sm:block w-px h-6 bg-zinc-800" />

                <button
                  onClick={openTicketUpload}
                  className="bg-zinc-800 text-zinc-200 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                >
                  <FileText className="size-4 sm:size-5" />
                  <span>Anexar passagem</span>
                </button>
              </div>
            )}

            {/* Seção 4: Upload de Passagem */}
            {isGuestsInputOpen && isTicketUploadOpen && createdTripId && (
              <div className="bg-zinc-900 p-4 rounded-xl shadow-shape">
                <TicketUpload tripId={createdTripId} />

                <div className="mt-6 flex justify-center">
                  <StarButton
                    onClick={async () => {
                      try {
                        // Salvar a viagem como confirmada (não é mais rascunho)
                        const trip = await handleSaveTrip(false);

                        if (trip) {
                          // Mostrar notificação de sucesso
                          showNotification(
                            "Viagem confirmada com sucesso!",
                            "success"
                          );

                          // Redirecionar para a página de resumo da viagem
                          navigate(`/trip/${createdTripId}/summary`);
                        }
                      } catch (error) {
                        // Mostrar notificação de erro
                        showNotification(
                          "Erro ao confirmar viagem. Por favor, tente novamente.",
                          "error"
                        );
                        console.error("Erro ao confirmar viagem:", error);
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    Confirmar viagem
                    <ArrowRight className="size-4 sm:size-5" />
                  </StarButton>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-zinc-500">
            Ao planejar sua viagem pela plann.er você automaticamente concorda
            com nossos{" "}
            <a className="text-zinc-300 underline" href="#">
              termos de uso
            </a>{" "}
            e{" "}
            <a className="text-zinc-300 underline" href="#">
              políticas de privacidade
            </a>
            .
          </p>
        </div>
      </div>

      {/* Modal para gerenciar convidados - agora com o componente GuestList integrado */}
      {isGuestsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[640px] rounded-xl py-5 px-4 sm:px-6 shadow-shape bg-zinc-900 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">
                Gerenciar Convidados
              </h2>
              <button
                title="Fechar"
                onClick={closeGuestsModal}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="size-4 sm:size-5 text-zinc-400" />
              </button>
            </div>

            {/* Exibir link de compartilhamento */}
            {shareLink && (
              <div className="mt-4 bg-zinc-800 p-3 rounded-lg text-left">
                <p className="text-sm mb-2">
                  Link de convite para {shareLink.guest.name}:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink.shareUrl}
                    readOnly
                    className="flex-1 bg-zinc-700 rounded-lg px-3 py-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink.shareUrl);
                      showNotification("Link copiado!", "success");
                    }}
                    className="bg-zinc-700 rounded-lg p-2"
                    title="Copiar link"
                  >
                    <Share2 className="size-4 text-zinc-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de convidados integrada no modal */}
            {createdTripId && <GuestList tripId={createdTripId} />}
          </div>
        </div>
      )}

      {/* Componente de status de sincronização */}
      <SyncStatus />
    </div>
  );
}
