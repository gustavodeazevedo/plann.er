import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import {
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  CheckSquare,
  Users,
  Home,
  Check,
  X,
  FileText,
  Download,
  Upload,
} from "lucide-react";
import { useNotification } from "../components/Notification/context";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { TicketUpload } from "../components/TicketUpload";
import { useErrorHandler } from "../utils/errorHandler";
import { useTheme } from "../components/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";

interface TripDetails {
  _id: string;
  destination: string;
  date: string;
  user: string;
  organizer: {
    name: string;
    email: string;
  };
  isDraft: boolean;
}

interface Guest {
  _id: string;
  name: string;
  email: string;
  confirmed: boolean;
  confirmedAt?: string;
}

interface ChecklistItem {
  _id: string;
  tripId?: string;
  description: string; // Alterado de text para description
  completed: boolean; // Alterado de checked para completed
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export function TripSummary() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [ticketName, setTicketName] = useState<string | null>(null);
  const [isTicketUploadOpen, setIsTicketUploadOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"checklist" | "guests">(
    "checklist"
  );

  // Função para construir a URL completa da passagem
  const getFullTicketUrl = (url: string) => {
    // Verificar se a URL já é absoluta (começa com http:// ou https://)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // URL já está completa (Vercel Blob)
      return url;
    } else {
      // URL relativa, adicionar baseUrl (armazenamento local)
      const baseUrl = api.defaults.baseURL || "";
      return `${baseUrl}${url}`;
    }
  };

  useEffect(() => {
    async function loadTrip() {
      try {
        setIsLoading(true);
        setError(null);

        // Carregar os dados da viagem
        const tripResponse = await api.get(`/trips/${id}`);
        setTrip(tripResponse.data);
        console.log("Dados da viagem carregados:", tripResponse.data);

        // Verificar e definir tarefas da viagem
        if (tripResponse.data && Array.isArray(tripResponse.data.tasks)) {
          setChecklistItems(tripResponse.data.tasks);
          console.log(
            `${tripResponse.data.tasks.length} itens de tarefas carregados`
          );
        } else {
          console.warn(
            "Resposta da viagem não contém tasks ou não é um array:",
            tripResponse.data.tasks
          );
          setChecklistItems([]);
        }

        // Carregar os convidados da viagem
        const guestsResponse = await api.get(`/trips/${id}/guests`);
        setGuests(guestsResponse.data.guests || []);
        console.log("Convidados carregados:", guestsResponse.data.guests || []);

        // Tentar carregar informações da passagem
        try {
          const ticketResponse = await api.get(`/trips/${id}/ticket`);
          if (ticketResponse.data && ticketResponse.data.ticketUrl) {
            setTicketUrl(ticketResponse.data.ticketUrl);
            setTicketName(ticketResponse.data.ticketName);
            console.log("Passagem encontrada:", ticketResponse.data);
          }
        } catch (ticketError) {
          // É normal não ter passagem anexada, então não exibimos erro
          console.log("Nenhuma passagem anexada para esta viagem");
        }

        setIsLoadingChecklist(false);
      } catch (error) {
        handleError(error, {
          context: "carregar resumo da viagem",
          showNotification: true,
        });
        setError("Não foi possível carregar o resumo da viagem.");
        setIsLoadingChecklist(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadTrip();
    } else {
      setIsLoading(false);
      setError("ID da viagem não fornecido");
    }
  }, [id, handleError]);

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }

  function handleGoBack() {
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-3xl w-full px-6 py-8 text-center">
          <LoadingIndicator
            size="large"
            message="Carregando resumo da viagem..."
          />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center ${
          theme === "dark" ? "bg-zinc-950" : "bg-zinc-50"
        }`}
      >
        <div className="max-w-3xl w-full px-6 py-8 text-center space-y-6">
          <img
            src="/logo.svg"
            alt="plann.er"
            className={`mx-auto ${theme === "light" ? "invert" : ""}`}
          />
          <div className="space-y-2">
            <h2
              className={`text-xl font-medium ${
                theme === "dark" ? "text-zinc-300" : "text-zinc-900"
              }`}
            >
              Resumo não encontrado
            </h2>
            <ErrorDisplay
              message={error || "Esta viagem não existe ou foi removida."}
              variant="error"
              className="mt-3"
            />
            <button
              onClick={handleGoBack}
              className={`mt-4 rounded-lg px-4 py-2 font-medium flex items-center justify-center gap-2 transition-colors mx-auto ${
                theme === "dark"
                  ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  : "bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300"
              }`}
            >
              <ArrowLeft className="size-4" />
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-pattern bg-no-repeat bg-center pt-6 pb-16 ${
        theme === "dark" ? "bg-zinc-950" : "bg-zinc-50"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className={`rounded-lg px-3 py-2 font-medium flex items-center justify-center gap-2 transition-colors ${
              theme === "dark"
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-300"
            }`}
          >
            <ArrowLeft className="size-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-4">
            <img
              src="/logo.svg"
              alt="plann.er"
              className={`h-8 ${theme === "light" ? "invert" : ""}`}
            />
            <ThemeToggle />
          </div>
        </div>

        <div
          className={`rounded-xl p-5 shadow-shape mb-6 ${
            theme === "dark" ? "bg-zinc-900" : "bg-white"
          }`}
        >
          <h1
            className={`text-xl font-semibold mb-4 text-center ${
              theme === "dark" ? "text-white" : "text-zinc-900"
            }`}
          >
            Resumo da Viagem
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
              }`}
            >
              <MapPin
                className={`size-5 ${
                  theme === "dark" ? "text-lime-300" : "text-lime-600"
                }`}
              />
              <span
                className={`text-lg ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                {trip.destination}
              </span>
            </div>

            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
              }`}
            >
              <Calendar
                className={`size-5 ${
                  theme === "dark" ? "text-lime-300" : "text-lime-600"
                }`}
              />
              <span
                className={`text-lg ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                {formatDate(trip.date)}
              </span>
            </div>
          </div>

          {ticketUrl && ticketName ? (
            <div
              className={`mt-4 border-t pt-4 ${
                theme === "dark" ? "border-zinc-800" : "border-zinc-200"
              }`}
            >
              <div
                className={`rounded-lg p-3 flex items-center justify-between ${
                  theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-lime-500/20" : "bg-lime-100"
                    }`}
                  >
                    <FileText
                      className={`size-5 ${
                        theme === "dark" ? "text-lime-300" : "text-lime-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-zinc-900"
                      }`}
                    >
                      Passagem
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {ticketName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Verificar se o token existe
                    const token = localStorage.getItem("@planner:token");
                    console.log("Token encontrado:", token ? "Sim" : "Não");

                    if (!token) {
                      alert(
                        "Você precisa estar logado para baixar a passagem. Redirecionando para login..."
                      );
                      navigate("/login");
                      return;
                    }

                    try {
                      // Fazer requisição para o backend com headers de autenticação
                      const downloadUrl = `${api.defaults.baseURL}/trips/${id}/ticket/download`;
                      console.log("Fazendo download do arquivo:", downloadUrl);

                      // Criar um link temporário para download
                      const link = document.createElement("a");
                      link.href = `${downloadUrl}?token=${token}`;
                      link.setAttribute(
                        "download",
                        trip.ticketName || "passagem.pdf"
                      );
                      link.style.display = "none";

                      // Adicionar ao DOM, clicar e remover
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error("Erro ao baixar passagem:", error);
                      alert("Erro ao baixar a passagem. Tente novamente.");
                    }
                  }}
                  className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  title="Baixar passagem"
                >
                  <Download className="size-4" />
                  Baixar PDF
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`mt-4 border-t pt-4 ${
                theme === "dark" ? "border-zinc-800" : "border-zinc-200"
              }`}
            >
              <div
                className={`rounded-lg p-3 flex items-center justify-between ${
                  theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-500/20 p-2 rounded-lg">
                    <FileText
                      className={`size-5 ${
                        theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      Passagem Aérea
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                      }`}
                    >
                      Nenhuma passagem anexada
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTicketUploadOpen(true)}
                  className="bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  title="Anexar passagem"
                >
                  <Upload className="size-4" />
                  Anexar PDF
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex mb-4 border-b ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-200"
          }`}
        >
          <button
            className={`py-3 px-5 flex items-center gap-2 transition-colors ${
              activeTab === "checklist"
                ? theme === "dark"
                  ? "border-b-2 border-lime-300 text-white"
                  : "border-b-2 border-lime-600 text-zinc-900 font-medium"
                : theme === "dark"
                ? "text-zinc-400 hover:text-zinc-300"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => setActiveTab("checklist")}
          >
            <CheckSquare className="size-4" />
            <span>Lista de Itens</span>
            {checklistItems.length > 0 && (
              <span
                className={`rounded-full text-xs px-2 py-0.5 font-medium ${
                  theme === "dark"
                    ? "bg-lime-300 text-lime-950"
                    : "bg-lime-600 text-white"
                }`}
              >
                {checklistItems.length}
              </span>
            )}
          </button>

          <button
            className={`py-3 px-5 flex items-center gap-2 transition-colors ${
              activeTab === "guests"
                ? theme === "dark"
                  ? "border-b-2 border-lime-300 text-white"
                  : "border-b-2 border-lime-600 text-zinc-900 font-medium"
                : theme === "dark"
                ? "text-zinc-400 hover:text-zinc-300"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => setActiveTab("guests")}
          >
            <Users className="size-4" />
            <span>Convidados</span>
            {guests.length > 0 && (
              <span
                className={`rounded-full text-xs px-2 py-0.5 font-medium ${
                  theme === "dark"
                    ? "bg-lime-300 text-lime-950"
                    : "bg-lime-600 text-white"
                }`}
              >
                {guests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "checklist" && (
          <div
            className={`rounded-xl p-5 shadow-shape ${
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <div className="mb-4">
              <h2
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                Itens para levar
              </h2>
            </div>

            {isLoadingChecklist ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
              </div>
            ) : checklistItems.length === 0 ? (
              <div
                className={`text-center py-8 ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                <CheckSquare className="size-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum item adicionado ainda.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li
                    key={item._id}
                    className={`rounded-lg p-3 flex items-center justify-between ${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex-1 ${
                          theme === "dark" ? "text-white" : "text-zinc-900"
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {item.completed ? (
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            theme === "dark"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              theme === "dark" ? "bg-green-400" : "bg-green-600"
                            }`}
                          ></span>
                          Concluído
                        </span>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            theme === "dark"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              theme === "dark"
                                ? "bg-yellow-400"
                                : "bg-amber-600"
                            }`}
                          ></span>
                          Pendente
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "guests" && (
          <div
            className={`rounded-xl p-5 shadow-shape ${
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}
              >
                Convidados
              </h2>
            </div>

            {guests.length === 0 ? (
              <div
                className={`text-center py-8 ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                <Users className="size-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum convidado adicionado ainda.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {guests.map((guest) => (
                  <li
                    key={guest._id}
                    className={`rounded-lg p-3 flex items-center justify-between ${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          theme === "dark" ? "bg-zinc-700" : "bg-zinc-200"
                        }`}
                      >
                        <User
                          className={`size-5 ${
                            theme === "dark" ? "text-zinc-300" : "text-zinc-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-zinc-900"
                          }`}
                        >
                          {guest.name}
                        </p>
                        <p
                          className={`text-sm ${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                          }`}
                        >
                          {guest.email}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Modal de upload de passagem */}
      {isTicketUploadOpen && id && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-xl p-6 w-full max-w-md relative ${
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            }`}
          >
            <button
              onClick={() => setIsTicketUploadOpen(false)}
              className={`absolute top-4 right-4 hover:text-white ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
              title="Fechar"
            >
              <X className="size-5" />
            </button>
            <TicketUpload tripId={id} />
          </div>
        </div>
      )}
    </div>
  );
}
