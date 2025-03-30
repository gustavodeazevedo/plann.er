import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign, KeyRound, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!name || !email || !password) {
      alert("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      navigate("/");
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
          <Link to="/login" className="text-zinc-300 underline">
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
