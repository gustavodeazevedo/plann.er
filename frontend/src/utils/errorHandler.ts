// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\utils\errorHandler.ts
import { AxiosError } from "axios";
import { useCallback } from "react";
import { useNotification } from "../components/Notification/context";

interface ErrorHandlerOptions {
  /**
   * Contexto onde o erro ocorreu (ex: "fazer login", "carregar viagens")
   */
  context?: string;

  /**
   * Mensagem de fallback se o erro não puder ser identificado
   */
  fallbackMessage?: string;

  /**
   * Se deve exibir uma notificação para o usuário
   */
  showNotification?: boolean;

  /**
   * Se deve lançar o erro após o tratamento (para propagação)
   */
  rethrow?: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/**
 * Hook que fornece funções para tratamento de erros padronizado
 */
export function useErrorHandler() {
  const { showNotification } = useNotification();

  /**
   * Analisa um erro e extrai uma mensagem amigável
   */
  const getErrorMessage = useCallback(
    (error: unknown, options?: ErrorHandlerOptions): string => {
      try {
        const context = options?.context ? `ao ${options.context}` : "";
        const fallback =
          options?.fallbackMessage ||
          `Ocorreu um erro ${context}. Tente novamente.`;

        if (error instanceof Error) {
          // Para erros padrão do JavaScript
          return error.message || fallback;
        }

        if (error && typeof error === "object" && "response" in error) {
          // Para erros do Axios
          const axiosError = error as AxiosError<ApiErrorResponse>;

          // Verificar se temos uma resposta da API
          if (axiosError.response?.data) {
            const data = axiosError.response.data;
            return data.message || data.error || fallback;
          }

          // Erro de rede ou timeout
          if (axiosError.code === "ECONNABORTED") {
            return "A conexão expirou. Verifique sua internet e tente novamente.";
          }

          if (axiosError.message.includes("Network Error")) {
            return "Erro de conexão. Verifique sua internet e tente novamente.";
          }

          return axiosError.message || fallback;
        }

        if (typeof error === "string") {
          return error;
        }

        // Fallback para qualquer outro tipo de erro
        return fallback;
      } catch (e) {
        console.error("Erro ao processar mensagem de erro:", e);
        return "Ocorreu um erro inesperado.";
      }
    },
    []
  );

  /**
   * Manipula um erro, registrando-o no console e potencialmente exibindo uma notificação
   */
  const handleError = useCallback(
    (error: unknown, options?: ErrorHandlerOptions) => {
      try {
        const errorMessage = getErrorMessage(error, options);

        // Registrar erro no console com informações detalhadas
        console.error(
          `[Erro ${options?.context ? `ao ${options.context}` : ""}]:`,
          error
        );

        // Exibir notificação se solicitado
        if (options?.showNotification !== false) {
          showNotification(errorMessage, "error");
        }

        // Relançar o erro se necessário (para handlers de erro upstream)
        if (options?.rethrow) {
          throw error;
        }

        return errorMessage;
      } catch (e) {
        console.error("Erro no tratamento de erro:", e);
        return "Ocorreu um erro inesperado.";
      }
    },
    [getErrorMessage, showNotification]
  );

  /**
   * Cria um manipulador de erro para funções assíncronas
   */
  const createAsyncErrorHandler = useCallback(
    <T>(
      asyncFn: () => Promise<T>,
      options?: ErrorHandlerOptions
    ): Promise<T | null> => {
      return asyncFn().catch((error) => {
        handleError(error, options);
        return null;
      });
    },
    [handleError]
  );

  return {
    getErrorMessage,
    handleError,
    createAsyncErrorHandler,
  };
}
