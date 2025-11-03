import { FormEvent, useEffect, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign, KeyRound, AlertCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { getSyncService } from "../lib/syncService";
import { AuthLoadingOverlay } from "../components/AuthLoadingOverlay";
import { loginWithWarmup } from "../utils/serverWarmup";

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect");
  const email = searchParams.get("email");
  const expired = searchParams.get("expired");

  useEffect(() => {
    if (expired === "true") {
      setShowSessionExpired(true);
    }
  }, [expired]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const emailInput = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!emailInput || !password) {
      alert("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      // Usar loginWithWarmup para melhor lidar com cold starts
      const response = await loginWithWarmup(async () => {
        return await api.post("/auth/login", {
          email: emailInput,
          password,
        });
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      // Atualizar o ID do usuário no serviço de sincronização
      const syncService = getSyncService();
      syncService.updateUserId(response.data.user.id);
      // Inicializar o serviço de sincronização para processar ações pendentes
      syncService.initialize(response.data.user.id);

      // Se o usuário veio de um convite e é o email correto, confirma a participação
      if (email && email === emailInput && redirect?.includes("/trip/")) {
        const tripId = redirect.split("/trip/")[1].split("?")[0];
        try {
          await api.post(`/trips/${tripId}/confirm`, { email });
        } catch (error) {
          console.error("Erro ao confirmar participação:", error);
        }
      }

      navigate(redirect || "/");
    } catch (error) {
      alert("E-mail ou senha inválidos");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse.credential) return;

    setIsLoading(true);
    try {
      // Usar loginWithWarmup para melhor lidar com cold starts
      const response = await loginWithWarmup(async () => {
        return await api.post("/auth/google", {
          credential: credentialResponse.credential,
        });
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      // Atualizar o ID do usuário no serviço de sincronização
      const syncService = getSyncService();
      syncService.updateUserId(response.data.user.id);
      // Inicializar o serviço de sincronização para processar ações pendentes
      syncService.initialize(response.data.user.id);

      // Se veio de um convite, confirma a participação
      if (email && redirect?.includes("/trip/")) {
        const tripId = redirect.split("/trip/")[1].split("?")[0];
        try {
          await api.post(`/trips/${tripId}/confirm`, { email });
        } catch (error) {
          console.error("Erro ao confirmar participação:", error);
        }
      }

      navigate(redirect || "/");
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Error in Google login:",
        err.response?.data || err.message
      );
      alert("Erro ao fazer login com Google. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google login error occurred");
    alert("Erro ao fazer login com Google. Tente novamente.");
  };

  return (
    <>
      <AuthLoadingOverlay isLoading={isLoading} type="login" />
      <AuthForm
        title="Entre na sua conta"
        submitText={isLoading ? "Entrando..." : "Entrar"}
        onSubmit={handleLogin}
        footer={
          <>
            Ainda não tem uma conta?{" "}
            <Link
              to={`/register${
                redirect ? `?redirect=${redirect}&email=${email}` : ""
              }`}
              className="text-zinc-300 underline"
            >
              Criar conta
            </Link>
          </>
        }
      >
        {showSessionExpired && (
          <div className="mb-4 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 text-sm">
                Sua sessão expirou. Por favor, faça login novamente para
                continuar.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
            <AtSign className="size-5 text-zinc-400" />
            <input
              required
              type="email"
              name="email"
              placeholder="Seu e-mail"
              defaultValue={email || ""}
              className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
            />
          </div>

          <div className="space-y-2">
            <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
              <KeyRound className="size-5 text-zinc-400" />
              <input
                required
                type="password"
                name="password"
                placeholder="Sua senha"
                className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              />
            </div>
            <Link
              to={`/forgot-password${redirect ? `?redirect=${redirect}` : ""}`}
              className="block text-right text-sm text-zinc-300 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <div className="flex justify-center mt-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              text="signin_with"
              shape="rectangular"
              locale="pt_BR"
            />
          </div>
        </div>
      </AuthForm>
    </>
  );
}
