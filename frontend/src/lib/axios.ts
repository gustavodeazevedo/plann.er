import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
  withCredentials: true, // Necessário para enviar/receber cookies com as requisições
});

// Interceptor de requisição
api.interceptors.request.use((config) => {
  // Usamos apenas o token do localStorage como backup
  // Cookies HttpOnly são enviados automaticamente pelo navegador
  const token = localStorage.getItem("@planner:token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Adicionar interceptor de resposta para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Verificar se o erro é de autenticação (401) ou token expirado
    if (
      error.response &&
      (error.response.status === 401 ||
        error.response.data?.error === "Invalid or expired token" ||
        error.response.data?.error === "Token expired")
    ) {
      console.log("Token expirado ou inválido, redirecionando para login");
      // Limpar os dados da sessão
      localStorage.removeItem("@planner:token");
      localStorage.removeItem("@planner:user");

      // Redirecionar para a página de login
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export { api };
