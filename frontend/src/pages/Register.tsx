import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign, KeyRound, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect");
  const email = searchParams.get("email");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString();
    const emailInput = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!name || !emailInput || !password) {
      alert("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name,
        email: emailInput,
        password,
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      // Se o usuário veio de um convite e é o email correto, confirma a participação
      if (email && email === emailInput && redirect?.includes("/trip/")) {
        const tripId = redirect.split("/trip/")[1].split("?")[0];
        try {
          await api.post(`/trips/${tripId}/confirm`, { email: emailInput });
        } catch (error) {
          console.error("Erro ao confirmar participação:", error);
        }
      }

      navigate(redirect || "/");
    } catch (error: any) {
      if (error.response?.data?.error === "User already exists") {
        alert("Este e-mail já está cadastrado");
      } else {
        alert("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthForm
      title="Crie sua conta"
      submitText={isLoading ? "Criando conta..." : "Criar conta"}
      onSubmit={handleRegister}
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            to={`/login${
              redirect ? `?redirect=${redirect}&email=${email}` : ""
            }`}
            className="text-zinc-300 underline"
          >
            Fazer login
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape">
          <User className="size-5 text-zinc-400" />
          <input
            required
            type="text"
            name="name"
            placeholder="Seu nome"
            className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
          />
        </div>

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
      </div>
    </AuthForm>
  );
}
