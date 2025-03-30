import {
  ArrowRight,
  AtSign,
  Calendar,
  LogOut,
  MapPin,
  Plus,
  Save,
  Settings2,
  Share2,
  UserRoundPlus,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "./lib/axios";
import { useNavigate } from "react-router-dom";

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

export function App() {
  const [isGuestsInputOpen, setIsGuestsInputOpen] = useState(false);
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedDraft = localStorage.getItem("tripDraft");
    if (savedDraft) {
      const draft: Trip = JSON.parse(savedDraft);
      setDestination(draft.destination);
      setDate(draft.date);
      setEmailsToInvite(draft.guests);
    }

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
  }

  function closeGuestsModal() {
    setIsGuestsModalOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("@planner:token");
    localStorage.removeItem("@planner:user");
    navigate("/login");
  }

  async function addNewEmailToInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const email = data.get("email")?.toString();

    if (!email) {
      return;
    }

    if (emailsToInvite.includes(email)) {
      alert("Este email já foi convidado");
      return;
    }

    setIsLoading(true);
    try {
      const trip = await handleSaveTrip(true);
      if (trip) {
        await api.post(`/trips/${trip._id}/invite`, { email });
        setEmailsToInvite([...emailsToInvite, email]);
        event.currentTarget.reset();
      }
    } catch (error) {
      alert("Erro ao enviar convite. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  function removeEmailFromInvites(emailToRemove: string) {
    const newEmailList = emailsToInvite.filter(
      (email) => email !== emailToRemove
    );

    setEmailsToInvite(newEmailList);
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
        guests: emailsToInvite,
        isDraft,
      });

      if (isDraft) {
        alert("Rascunho salvo com sucesso!");
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

  async function handleShareTrip() {
    if (!destination || !date) {
      alert("Preencha o destino e a data antes de compartilhar!");
      return;
    }

    setIsLoading(true);
    try {
      const trip = await handleSaveTrip();
      if (trip) {
        const shareUrl = `${window.location.origin}/trip/${trip._id}`;
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copiado para a área de transferência!");
      }
    } catch (error) {
      alert("Erro ao compartilhar a viagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-pattern bg-no-repeat bg-center">
      {user && (
        <div className="w-full">
          <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 text-center">
            <span
              className="text-xl sm:text-2xl font-medium"
              style={{
                background:
                  "linear-gradient(90deg, #a3e635 10%, #ffffff 50%, #ADFF2F 90%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                animation:
                  "7s ease-in-out 0s infinite normal none running pulsingGradient",
              }}
            >
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
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="size-5 text-zinc-400 flex-shrink-0" />
                <input
                  disabled={isGuestsInputOpen}
                  type="text"
                  placeholder="Para onde você vai?"
                  className="bg-transparent text-base sm:text-lg placeholder-zinc-400 outline-none flex-1 min-w-0"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-zinc-400 flex-shrink-0" />
                <input
                  disabled={isGuestsInputOpen}
                  type="text"
                  placeholder="Quando?"
                  className="bg-transparent text-base sm:text-lg placeholder-zinc-400 w-full sm:w-40 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

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
                  <UserRoundPlus className="size-5 text-zinc-400 flex-shrink-0" />
                  <span className="text-zinc-400 text-base sm:text-lg flex-1">
                    Quem estará na viagem?
                  </span>
                </button>

                <div className="hidden sm:block w-px h-6 bg-zinc-800" />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={handleShareTrip}
                    disabled={isLoading}
                    className="bg-zinc-800 text-zinc-200 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sm:hidden">Compartilhar</span>
                    <span className="hidden sm:inline">
                      Compartilhar viagem
                    </span>
                    <Share2 className="size-4 sm:size-5" />
                  </button>

                  <button
                    onClick={() => handleSaveTrip(false)}
                    disabled={isLoading}
                    className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Confirmar
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
                  Selecionar convidados
                </h2>
                <button
                  onClick={closeGuestsModal}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="size-4 sm:size-5 text-zinc-400" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400">
                Os convidados irão receber e-mails para confirmar a participação
                na viagem.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {emailsToInvite.map((email) => {
                return (
                  <div
                    key={email}
                    className="py-1.5 px-2.5 rounded-md bg-zinc-800 flex items-center gap-2"
                  >
                    <span className="text-zinc-300 text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmailFromInvites(email)}
                      className="p-1 hover:bg-zinc-700 rounded transition-colors"
                    >
                      <X className="size-3 sm:size-4 text-zinc-400" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="w-full h-px bg-zinc-800" />

            <form
              onSubmit={addNewEmailToInvite}
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="px-2 flex items-center flex-1 gap-2">
                <AtSign className="text-zinc-400 size-5 flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="Digite o email do convidado"
                  className="bg-transparent text-base sm:text-lg placeholder-zinc-400 outline-none flex-1 min-w-0"
                />
              </div>

              <button
                type="submit"
                className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-lime-400 transition-colors"
              >
                Convidar
                <Plus className="size-4 sm:size-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
