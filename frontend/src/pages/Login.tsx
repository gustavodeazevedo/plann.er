import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      alert("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      navigate("/");
    } catch (error) {
      alert("E-mail ou senha inválidos");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      console.log("Google response:", credentialResponse);
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      console.log("API response:", response.data);
      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      navigate("/");
    } catch (error: any) {
      console.error(
        "Error in Google login:",
        error.response?.data || error.message
      );
      alert("Erro ao fazer login com Google. Tente novamente.");
    }
  };

  const handleGoogleError = () => {
    console.error("Google login error occurred");
    alert("Erro ao fazer login com Google. Tente novamente.");
  };

  return (
    <AuthForm
      title="Entre na sua conta"
      submitText={isLoading ? "Entrando..." : "Entrar"}
      onSubmit={handleLogin}
      footer={
        <>
          Ainda não tem uma conta?{" "}
          <Link to="/register" className="text-zinc-300 underline">
            Criar conta
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
          <AtSign className="size-5 text-zinc-400" />
          <input
            required
            type="email"
            name="email"
            placeholder="Seu e-mail"
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
            to="/forgot-password"
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
  );
}
