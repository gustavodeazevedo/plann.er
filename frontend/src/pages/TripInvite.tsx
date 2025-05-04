import { FormEvent, useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { api } from "../lib/axios";
import { AtSign } from "lucide-react";

interface Trip {
  destination: string;
  date: string;
  organizer: {
    name: string;
    email: string;
  };
}

interface Guest {
  email: string;
  confirmed: boolean;
  confirmedAt?: string;
  permissions?: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

interface TripResponse {
  trip: Trip;
  guest: Guest | null;
}

export function TripInvite() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [wantsToContribute, setWantsToContribute] = useState(false);
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");
  const token = localStorage.getItem("@planner:token");

  useEffect(() => {
    async function loadTrip() {
      try {
        const response = await api.get<TripResponse>(`/trips/${id}/public`, {
          params: { email },
        });

        setTrip(response.data.trip);

        // Verificar se o convidado já confirmou a participação
        if (response.data.guest?.confirmed) {
          setHasConfirmed(true);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da viagem:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id && email) {
      loadTrip();
    } else {
      setIsLoading(false);
    }

    // Se já estiver autenticado, redireciona para a página de detalhes
    if (token) {
      navigate(`/trip/${id}?email=${encodeURIComponent(email || "")}`);
    }
  }, [id, email, token, navigate]);

  async function handleConfirmParticipation(event: FormEvent) {
    event.preventDefault();
    if (!email) return;

    try {
      const response = await api.post(`/trips/${id}/confirm`, {
        email,
        wantsToContribute,
      });

      setHasConfirmed(true);
      localStorage.setItem("@planner:guestEmail", email);

      // Redireciona para a página de login com os parâmetros necessários
      navigate(
        `/login?redirect=/trip/${id}&email=${encodeURIComponent(
          email
        )}&contribute=${wantsToContribute}`
      );
    } catch (error) {
      alert("Erro ao confirmar participação. Tente novamente.");
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

  return (
    <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
      <div className="max-w-md w-full px-6 text-center space-y-10">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="plann.er" />
          <h2 className="text-zinc-300 text-lg font-medium">
            {hasConfirmed ? "Participação confirmada!" : "Convite para viagem"}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-lg space-y-4">
            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Organizador</p>
              <p className="text-zinc-200 text-lg">{trip.organizer.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Destino</p>
              <p className="text-zinc-200 text-lg">{trip.destination}</p>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-400 text-sm">Data</p>
              <p className="text-zinc-200 text-lg">{trip.date}</p>
            </div>
          </div>

          {!hasConfirmed ? (
            <form onSubmit={handleConfirmParticipation} className="space-y-4">
              {!email && (
                <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
                  <AtSign className="size-5 text-zinc-400" />
                  <input
                    required
                    type="email"
                    placeholder="Confirme seu e-mail"
                    className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
                    value={email || ""}
                    readOnly
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 bg-zinc-900 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="contribute"
                  checked={wantsToContribute}
                  onChange={(e) => setWantsToContribute(e.target.checked)}
                  className="h-4 w-4 text-lime-600 focus:ring-lime-500 border-gray-300 rounded"
                />
                <label htmlFor="contribute" className="text-zinc-200 text-sm">
                  Quero contribuir com esta viagem (editar datas, convidados,
                  etc)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium hover:bg-lime-400 transition-colors"
              >
                Confirmar participação
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-zinc-400">
                Sua participação foi confirmada! Para acessar os detalhes da
                viagem, faça login ou crie uma conta.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to={`/login?redirect=/trip/${id}&email=${encodeURIComponent(
                    email || ""
                  )}&contribute=${wantsToContribute}`}
                  className="bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium hover:bg-lime-400 transition-colors"
                >
                  Fazer login
                </Link>
                <Link
                  to={`/register?redirect=/trip/${id}&email=${encodeURIComponent(
                    email || ""
                  )}&contribute=${wantsToContribute}`}
                  className="bg-zinc-800 text-zinc-200 rounded-lg px-5 py-2 font-medium hover:bg-zinc-700 transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
