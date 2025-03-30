import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign } from "lucide-react";
import { Link } from "react-router-dom";

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString();

    if (!email) {
      alert("Digite seu e-mail");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEmailSent(true);
    } catch (error) {
      alert("Erro ao enviar e-mail de recuperação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-pattern bg-no-repeat bg-center">
        <div className="max-w-md w-full px-6 text-center space-y-10">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="plann.er" />
            <div className="space-y-2">
              <h2 className="text-zinc-300 text-lg font-medium">
                E-mail enviado!
              </h2>
              <p className="text-zinc-400">
                Verifique sua caixa de entrada e siga as instruções para
                recuperar sua senha.
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full bg-lime-300 text-lime-950 rounded-lg px-5 py-2 font-medium hover:bg-lime-400"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Recuperar senha"
      submitText={isLoading ? "Enviando..." : "Enviar e-mail de recuperação"}
      onSubmit={handleForgotPassword}
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
          <AtSign className="size-5 text-zinc-400" />
          <input
            required
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
          />
        </div>
      </div>
    </AuthForm>
  );
}
