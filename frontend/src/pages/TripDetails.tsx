import { FormEvent, useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { Calendar, MapPin, Users } from "lucide-react";

interface TripDetails {
  destination: string;
  date: string;
  organizer: {
    name: string;
    email: string;
  };
  collaborators: {
    id: string;
    name: string;
    email: string;
    permissions: {
      canEdit: boolean;
      canInvite: boolean;
    };
  }[];
}

interface Guest {
  email: string;
  confirmed: boolean;
  confirmedAt?: string;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

export function TripDetails() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);

  const email = searchParams.get("email");

  useEffect(() => {
    async function loadTrip() {
      try {
        const response = await api.get(`/trips/${id}/public`, {
          params: { email },
        });
        setTrip(response.data.trip);
        setGuest(response.data.guest);
        setDestination(response.data.trip.destination);
        setDate(response.data.trip.date);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id && email) {
      loadTrip();
    } else {
      setIsLoading(false);
    }
  }, [id, email]);

  async function handleUpdateTrip(event: FormEvent) {
    event.preventDefault();
    if (!trip) return;

    try {
      await api.patch(`/trips/${id}`, {
        destination,
        date,
      });

      setIsEditing(false);
      setTrip((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          destination,
          date,
        };
      });
    } catch (error) {
      alert("Erro ao atualizar viagem. Tente novamente.");
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center">
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center space-y-4">
          <img src="/logo.svg" alt="plann.er" className="mx-auto" />
          <div className="space-y-2">
            <h2 className="text-zinc-300 text-lg font-medium">
              Viagem não encontrada
            </h2>
            <p className="text-zinc-400">
              O link que você acessou é inválido ou esta viagem não existe mais.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = guest?.permissions?.canEdit || false;

  return (
    <div className="min-h-screen flex flex-col bg-pattern bg-no-repeat bg-center">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-8">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="plann.er" className="w-32 sm:w-auto" />
            <h2 className="text-zinc-300 text-lg sm:text-xl font-medium">
              Detalhes da Viagem
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 space-y-6 shadow-shape">
            {isEditing ? (
              <form onSubmit={handleUpdateTrip} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Destino</label>
                  <div className="h-12 bg-zinc-800 px-4 rounded-lg flex items-center gap-3">
                    <MapPin className="size-5 text-zinc-400" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Data</label>
                  <div className="h-12 bg-zinc-800 px-4 rounded-lg flex items-center gap-3">
                    <Calendar className="size-5 text-zinc-400" />
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-zinc-800 text-zinc-200 rounded-lg px-4 py-2 font-medium hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium hover:bg-lime-400 transition-colors"
                  >
                    Salvar alterações
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="size-5 text-zinc-400 mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Destino</p>
                      <p className="text-lg text-zinc-100">
                        {trip.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-zinc-400 mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Data</p>
                      <p className="text-lg text-zinc-100">{trip.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="size-5 text-zinc-400 mt-1" />
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Organizador</p>
                      <p className="text-lg text-zinc-100">
                        {trip.organizer.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-lime-300 text-lime-950 rounded-lg px-4 py-2 font-medium hover:bg-lime-400 transition-colors"
                    >
                      Editar viagem
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
