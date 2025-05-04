import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { Calendar, MapPin, User } from "lucide-react";
import { useNotification } from "../components/Notification/context";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { useErrorHandler } from "../utils/errorHandler";

interface TripDetails {
  _id: string;
  destination: string;
  date: string;
  user: string;
  organizer: {
    name: string;
    email: string;
  };
}

interface Guest {
  name?: string;
  email?: string;
  confirmed?: boolean;
  confirmedAt?: string;
  permissions?: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

export function TripDetails() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();

  const email = searchParams.get("email");
  const accessId = searchParams.get("accessId");
  const guestName = searchParams.get("name");

  useEffect(() => {
    async function loadTrip() {
      try {
        setIsLoading(true);
        setError(null);

        // Se temos um accessId, estamos acessando como convidado via link direto
        if (accessId) {
          try {
            // Carregar os dados da viagem e do convidado usando o accessId
            const guestResponse = await api.get(
              `/trips/${id}/guest/${accessId}`
            );
            setTrip(guestResponse.data.trip);
            setGuest(guestResponse.data.guest);
            setIsOwner(false);

            console.log(
              "Dados do convidado carregados via accessId:",
              guestResponse.data
            );
          } catch (error) {
            handleError(error, {
              context: "carregar detalhes do convidado",
              showNotification: true,
            });
            setError(
              "Não foi possível carregar os detalhes do convidado. O link pode estar expirado ou ser inválido."
            );
          }
        } else {
          // Tentar carregar como proprietário da viagem
          try {
            const tripResponse = await api.get(`/trips/${id}`);
            const tripData = tripResponse.data;

            // Garantir que temos os dados do organizador
            if (!tripData.organizer && tripData.user) {
              // Se não tiver organizer mas tiver user, tenta usar os dados do user como organizer
              const userData = JSON.parse(
                localStorage.getItem("@planner:user") || "{}"
              );
              tripData.organizer = {
                name: userData.name,
                email: userData.email,
              };
            }

            setTrip(tripData);
            setIsOwner(true); // É o proprietário da viagem

            // Definir dados do usuário logado para exibição consistente
            const userData = JSON.parse(
              localStorage.getItem("@planner:user") || "{}"
            );
            setGuest({
              name: userData.name || "Você",
              email: userData.email,
            });
          } catch (error) {
            // Se falhar, tentamos carregar como convidado por email
            try {
              const publicResponse = await api.get(`/trips/${id}/public`, {
                params: { email },
              });

              const tripData = publicResponse.data.trip;

              // Garantir que temos dados do organizador na resposta pública
              if (!tripData.organizer && tripData.user) {
                tripData.organizer = { name: "Organizador da viagem" };
              }

              setTrip(tripData);
              setGuest(publicResponse.data.guest);
              setIsOwner(false);
            } catch (error) {
              handleError(error, {
                context: "carregar detalhes da viagem",
                showNotification: true,
              });
              setError(
                "Não foi possível carregar os detalhes da viagem. Verifique se o link está correto ou se você tem permissão para acessá-la."
              );
            }
          }
        }
      } catch (error) {
        handleError(error, {
          context: "carregar viagem",
          showNotification: true,
        });
        setError("Ocorreu um erro ao tentar carregar os detalhes da viagem.");
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
  }, [id, email, accessId, guestName, showNotification, handleError]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center">
          <LoadingIndicator
            size="large"
            message="Carregando detalhes da viagem..."
          />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center space-y-6">
          <img src="/logo.svg" alt="plann.er" className="mx-auto" />
          <div className="space-y-2">
            <h2 className="text-zinc-300 text-lg font-medium">
              Viagem não encontrada
            </h2>
            <ErrorDisplay
              message={
                error ||
                "O link que você acessou é inválido ou esta viagem não existe mais."
              }
              variant="error"
              className="mt-3"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
      <div className="max-w-md w-full px-6 text-center space-y-10">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="plann.er" />
          <h2 className="text-zinc-300 text-lg font-medium">
            Detalhes da Viagem
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-lg space-y-4">
            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Convidado</p>
              <div className="flex items-center justify-center gap-2">
                <User className="size-5 text-zinc-400" />
                <p className="text-zinc-200 text-lg">
                  {guest?.name || "Convidado"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Destino</p>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="size-5 text-zinc-400" />
                <p className="text-zinc-200 text-lg">{trip.destination}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Data</p>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="size-5 text-zinc-400" />
                <p className="text-zinc-200 text-lg">{trip.date}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Organizador</p>
              <div className="flex items-center justify-center gap-2">
                <User className="size-5 text-zinc-400" />
                <p className="text-zinc-200 text-lg">
                  {trip.organizer?.name ||
                    (isOwner ? "Você" : "Organizador da viagem")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
