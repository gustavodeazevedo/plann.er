import { api } from "../lib/axios";

/**
 * Tenta fazer um ping no servidor para acordá-lo antes de fazer login
 * Isso ajuda a reduzir o tempo de espera durante o cold start
 */
export async function warmupServer(): Promise<boolean> {
  try {
    // Fazer uma requisição simples para acordar o servidor
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch (error) {
    // Servidor ainda não respondeu, mas a tentativa já pode ter iniciado o cold start
    return false;
  }
}

/**
 * Faz requisições com retry automático e backoff exponencial
 * Útil para lidar com cold starts de servidores serverless
 */
export async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      lastError = error as Error;

      // Se for o último retry ou erro não relacionado a timeout/conexão, lança o erro
      if (attempt === maxRetries) {
        throw error;
      }

      // Verifica se é um erro de timeout ou conexão
      const errorObj = error as {
        code?: string;
        message?: string;
        response?: unknown;
      };
      const isTimeoutError =
        errorObj.code === "ECONNABORTED" ||
        errorObj.message?.includes("timeout") ||
        errorObj.message?.includes("Network Error");

      if (!isTimeoutError && errorObj.response) {
        // Se recebeu uma resposta do servidor (não foi timeout), não faz retry
        throw error;
      }

      // Calcular delay com backoff exponencial
      const delay = initialDelay * Math.pow(2, attempt);

      console.log(
        `Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`
      );

      // Aguardar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Combina warmup + retry para login mais confiável
 */
export async function loginWithWarmup<T>(
  loginFn: () => Promise<T>
): Promise<T> {
  // Tentar acordar o servidor primeiro (não aguarda)
  warmupServer().catch(() => {
    // Ignora erro do warmup
  });

  // Aguardar um pouco para dar tempo do servidor começar a acordar
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Fazer login com retry
  return requestWithRetry(loginFn, 3, 3000);
}
