import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      alert("Token de recuperação inválido");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!password || !confirmPassword) {
      alert("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        password,
      });

      alert("Senha alterada com sucesso!");
      navigate("/login");
    } catch (error) {
      alert("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center space-y-10">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="plann.er" />
            <div className="space-y-2">
              <h2 className="text-zinc-300 text-lg font-medium">
                Link inválido
              </h2>
              <p className="text-zinc-400">
                Este link de recuperação é inválido ou já expirou.
              </p>
            </div>
          </div>

          <Link
            to="/forgot-password"
            className="block w-full bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium hover:bg-lime-400"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Criar nova senha"
      submitText={isLoading ? "Alterando..." : "Alterar senha"}
      onSubmit={handleResetPassword}
      footer={
        <>
          Lembrou sua senha?{" "}
          <Link to="/login" className="text-zinc-300 underline">
            Fazer login
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
          <KeyRound className="size-5 text-zinc-400" />
          <input
            required
            type="password"
            name="password"
            placeholder="Nova senha"
            className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
          />
        </div>

        <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
          <KeyRound className="size-5 text-zinc-400" />
          <input
            required
            type="password"
            name="confirmPassword"
            placeholder="Confirme a nova senha"
            className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
          />
        </div>
      </div>
    </AuthForm>
  );
}
