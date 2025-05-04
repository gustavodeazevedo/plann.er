import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { Calendar, MapPin, User } from "lucide-react";

interface TripDetails {
  destination: string;
  date: string;
  organizer: {
    name: string;
  };
}

interface Guest {
  name: string;
  accessId: string;
  email?: string;
  confirmed?: boolean;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

interface GuestAccessResponse {
  trip: TripDetails;
  guest: Guest;
}

export function GuestAccess() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id, accessId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guestName = searchParams.get("name");
  const token = localStorage.getItem("@planner:token");

  useEffect(() => {
    async function loadTripAccess() {
      try {
        const response = await api.get<GuestAccessResponse>(
          `/trips/${id}/guest/${accessId}`
        );
        setTrip(response.data.trip);
        setGuest(response.data.guest);

        // Se já estiver autenticado, redireciona para a página de detalhes padronizada
        if (token) {
          navigate(`/trip/${id}?accessId=${accessId}`);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da viagem:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id && accessId) {
      loadTripAccess();
    } else {
      setIsLoading(false);
    }
  }, [id, accessId, token, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center">
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!trip || !guest) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center space-y-4">
          <img src="/logo.svg" alt="plann.er" className="mx-auto" />
          <div className="space-y-2">
            <h2 className="text-zinc-300 text-lg font-medium">
              Acesso não encontrado
            </h2>
            <p className="text-zinc-400">
              O link que você acessou é inválido ou expirou.
            </p>
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
                  {guestName || guest.name}
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
              <p className="text-zinc-200 text-lg">{trip.organizer.name}</p>
            </div>
          </div>

          <div className="flex justify-center"></div>
        </div>
      </div>
    </div>
  );
}
