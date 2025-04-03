import {
  ArrowRight,
  Calendar,
  LogOut,
  MapPin,
  Plus,
  Settings2,
  Share2,
  User,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "./lib/axios";
import { LocationAutocomplete } from "./components/LocationAutocomplete";
import { DatePicker } from "./components/DatePicker";
import { useNavigate } from "react-router-dom";
import "./styles/app.css";
import "./styles/datepicker.css";

interface Trip {
  _id: string;
  destination: string;
  date: string;
  guests: string[];
  isDraft: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ShareLink {
  shareUrl: string;
  guest: {
    name: string;
    accessId: string;
  };
}

export function App() {
  const [isGuestsInputOpen, setIsGuestsInputOpen] = useState(false);
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("@planner:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function openGuestsInput() {
    setIsGuestsInputOpen(true);
  }

  function closeGuestsInput() {
    setIsGuestsInputOpen(false);
  }

  function openGuestsModal() {
    setIsGuestsModalOpen(true);
    setShareLink(null); // Limpa o link anterior ao abrir o modal
  }

  function closeGuestsModal() {
    setIsGuestsModalOpen(false);
    setShareLink(null);
  }

  function handleLogout() {
    localStorage.removeItem("@planner:token");
    localStorage.removeItem("@planner:user");
    navigate("/login");
  }

  async function addNewGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = data.get("name")?.toString();

    if (!name) {
      alert("Digite o nome do convidado");
      return;
    }

    setIsLoading(true);
    try {
      const trip = await handleSaveTrip(true);
      if (trip) {
        const response = await api.post<ShareLink>(
          `/trips/${trip._id}/guests`,
          { name }
        );
        setShareLink(response.data);
        event.currentTarget.reset();
      }
    } catch (error) {
      alert("Erro ao adicionar convidado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveTrip(isDraft: boolean = false) {
    if (!destination || !date) {
      alert("Preencha o destino e a data antes de salvar!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<Trip>("/trips", {
        destination,
        date,
        isDraft,
      });

      if (isDraft) {
        // Silenciosamente salva como rascunho
        return response.data;
      } else {
        alert("Viagem confirmada com sucesso!");
      }

      return response.data;
    } catch (error) {
      alert("Erro ao salvar a viagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-pattern bg-no-repeat bg-center">
      {user && (
        <div className="w-full">
          <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 text-center">
            <span className="text-xl sm:text-2xl font-medium welcome-text">
              Olá, {user.name}
            </span>
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
            <div className="h-auto sm:h-16 bg-zinc-900 p-3 sm:px-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center shadow-shape gap-3">
              <LocationAutocomplete
                disabled={isGuestsInputOpen}
                value={destination}
                onChange={setDestination}
              />

              <DatePicker
                disabled={isGuestsInputOpen}
                value={date}
                onChange={setDate}
                className="w-full sm:w-40"
              />

              <div className="hidden sm:block w-px h-6 bg-zinc-800" />

              {isGuestsInputOpen ? (
                <button
                  onClick={closeGuestsInput}
                  className="bg-zinc-800 text-zinc-200 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                >
                  <span className="sm:hidden">Alterar</span>
                  <span className="hidden sm:inline">Alterar local/data</span>
                  <Settings2 className="size-4 sm:size-5" />
                </button>
              ) : (
                <button
                  onClick={openGuestsInput}
                  className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 transition-colors"
                >
                  Continuar
                  <ArrowRight className="size-4 sm:size-5" />
                </button>
              )}
            </div>

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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => handleSaveTrip(false)}
                    disabled={isLoading}
                    className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Confirmar viagem
                    <ArrowRight className="size-4 sm:size-5" />
                  </button>
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

      {isGuestsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[640px] rounded-xl py-5 px-4 sm:px-6 shadow-shape bg-zinc-900 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold">
                  Adicionar convidado
                </h2>
                <button
                  title="Voltar para página anterior"
                  onClick={closeGuestsModal}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="size-4 sm:size-5 text-zinc-400" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400">
                Digite o nome do convidado para gerar um link de acesso
                personalizado.
              </p>
            </div>

            <form
              onSubmit={addNewGuest}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 px-2 flex items-center gap-2">
                <User className="text-zinc-400 size-5 flex-shrink-0" />
                <input
                  type="text"
                  name="name"
                  placeholder="Nome do convidado"
                  className="bg-transparent text-base sm:text-lg placeholder-zinc-400 outline-none flex-1 min-w-0"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Gerando link..." : "Adicionar"}
                <Plus className="size-4 sm:size-5" />
              </button>
            </form>

            {shareLink && (
              <div className="p-3 bg-zinc-800 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {shareLink.guest.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Link de acesso gerado
                    </p>
                  </div>
                  <button
                    title="Copiar link de convite"
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink.shareUrl);
                      alert("Link copiado!");
                    }}
                    className="p-2 hover:bg-zinc-700 rounded transition-colors"
                  >
                    <Share2 className="size-4 text-zinc-400" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 break-all">
                  {shareLink.shareUrl}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
