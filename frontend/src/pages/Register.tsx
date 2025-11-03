import { FormEvent, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { api } from "../lib/axios";
import { AtSign, KeyRound, User, Check } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateForm,
  ValidationResult,
} from "../utils/validation";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { useErrorHandler } from "../utils/errorHandler";
import { useNotification } from "../components/Notification/context";
import { getSyncService } from "../lib/syncService";
import { AuthLoadingOverlay } from "../components/AuthLoadingOverlay";
import { loginWithWarmup } from "../utils/serverWarmup";

export function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
  }>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleError } = useErrorHandler();
  const { showNotification } = useNotification();

  const redirect = searchParams.get("redirect");
  const emailParam = searchParams.get("email");

  // Preencher o e-mail do convite se disponível
  useState(() => {
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  });
  // Validar campo ao mudar
  const validateField = (
    field: "name" | "email" | "password" | "passwordConfirmation",
    value: string
  ) => {
    let validationResult: ValidationResult = { valid: true };

    switch (field) {
      case "name":
        validationResult = validateName(value);
        break;
      case "email":
        validationResult = validateEmail(value);
        break;
      case "password":
        validationResult = validatePassword(value);
        break;
      case "passwordConfirmation":
        if (value !== formData.password) {
          validationResult = {
            valid: false,
            message: "As senhas não conferem",
          };
        }
        break;
    }

    if (!validationResult.valid) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validationResult.message,
      }));
      return false;
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
      return true;
    }
  };

  // Atualizar valores do formulário
  const handleInputChange = (
    field: "name" | "email" | "password" | "passwordConfirmation",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    validateField(field, value);

    // Se estamos alterando a senha principal, precisamos revalidar a confirmação
    if (field === "password" && formData.passwordConfirmation) {
      validateField("passwordConfirmation", formData.passwordConfirmation);
    }
  };

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Validar todos os campos antes de enviar
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    // Validação da confirmação de senha
    let passwordConfirmationValidation = { valid: true, message: "" };
    if (formData.password !== formData.passwordConfirmation) {
      passwordConfirmationValidation = {
        valid: false,
        message: "As senhas não conferem",
      };
      setFieldErrors((prev) => ({
        ...prev,
        passwordConfirmation: "As senhas não conferem",
      }));
    }

    const formValidation = validateForm([
      nameValidation,
      emailValidation,
      passwordValidation,
      passwordConfirmationValidation,
    ]);

    if (!formValidation.valid) {
      setError(
        formValidation.message || "Por favor, corrija os erros no formulário"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Usar loginWithWarmup para melhor lidar com cold starts
      const response = await loginWithWarmup(async () => {
        return await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      });

      localStorage.setItem("@planner:token", response.data.token);
      localStorage.setItem("@planner:user", JSON.stringify(response.data.user));

      // Inicializar o serviço de sincronização
      try {
        const syncService = getSyncService();
        syncService.updateUserId(response.data.user.id);
        syncService.initialize(response.data.user.id);
      } catch (syncError) {
        console.error(
          "Erro ao inicializar serviço de sincronização:",
          syncError
        );
        // Continuar mesmo se a sincronização falhar
      }

      // Se o usuário veio de um convite e é o email correto, confirma a participação
      if (
        emailParam &&
        emailParam === formData.email &&
        redirect?.includes("/trip/")
      ) {
        const tripId = redirect.split("/trip/")[1].split("?")[0];
        try {
          await api.post(`/trips/${tripId}/confirm`, { email: formData.email });
        } catch (error) {
          handleError(error, {
            context: "confirmar participação",
            showNotification: true,
          });
        }
      }

      showNotification("Conta criada com sucesso!", "success");
      navigate(redirect || "/");
    } catch (error: unknown) {
      // Verificar se é um erro de usuário já existente
      const isUserExistsError =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data &&
        error.response.data.error === "User already exists";

      if (isUserExistsError) {
        setError("Este e-mail já está cadastrado");
        setFieldErrors((prev) => ({
          ...prev,
          email: "Este e-mail já está sendo usado por outra conta",
        }));
      } else {
        handleError(error, {
          context: "criar conta",
          fallbackMessage: "Erro ao criar conta. Tente novamente.",
          showNotification: true,
        });
        setError("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <>
      <AuthLoadingOverlay isLoading={isLoading} type="register" />
      <AuthForm
        title="Crie sua conta"
        submitText={isLoading ? "Criando conta..." : "Criar conta"}
        onSubmit={handleRegister}
        footer={
          <>
            Já tem uma conta?{" "}
            <Link
              to={`/login${
                redirect ? `?redirect=${redirect}&email=${emailParam}` : ""
              }`}
              className="text-zinc-300 underline"
            >
              Fazer login
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <ErrorDisplay
              message={error}
              variant="error"
              onDismiss={() => setError(null)}
            />
          )}

          <div className="space-y-1">
            <div
              className={`h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape ${
                fieldErrors.name ? "border border-red-800" : ""
              }`}
            >
              <User
                className={`size-5 ${
                  fieldErrors.name ? "text-red-400" : "text-zinc-400"
                }`}
              />
              <input
                required
                type="text"
                name="name"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-red-400 px-2">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <div
              className={`h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape ${
                fieldErrors.email ? "border border-red-800" : ""
              }`}
            >
              <AtSign
                className={`size-5 ${
                  fieldErrors.email ? "text-red-400" : "text-zinc-400"
                }`}
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Seu e-mail"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-400 px-2">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div
              className={`h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape ${
                fieldErrors.password ? "border border-red-800" : ""
              }`}
            >
              <KeyRound
                className={`size-5 ${
                  fieldErrors.password ? "text-red-400" : "text-zinc-400"
                }`}
              />
              <input
                required
                type="password"
                name="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400 px-2">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div
              className={`h-12 bg-zinc-900 px-4 rounded-lg flex items-center gap-3 shadow-shape ${
                fieldErrors.passwordConfirmation ? "border border-red-800" : ""
              }`}
            >
              <Check
                className={`size-5 ${
                  fieldErrors.passwordConfirmation
                    ? "text-red-400"
                    : "text-zinc-400"
                }`}
              />
              <input
                required
                type="password"
                name="passwordConfirmation"
                placeholder="Confirme sua senha"
                value={formData.passwordConfirmation}
                onChange={(e) =>
                  handleInputChange("passwordConfirmation", e.target.value)
                }
                className="bg-transparent text-lg placeholder-zinc-400 outline-none flex-1"
              />
            </div>
            {fieldErrors.passwordConfirmation && (
              <p className="text-xs text-red-400 px-2">
                {fieldErrors.passwordConfirmation}
              </p>
            )}
          </div>
        </div>
      </AuthForm>
    </>
  );
}
