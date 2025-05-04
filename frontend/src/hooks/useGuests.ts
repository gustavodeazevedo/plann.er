// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\hooks\useGuests.ts
import { useState, FormEvent } from "react";
import { api } from "../lib/axios";
import { useNotification } from "../components/Notification/context";
import { useErrorHandler } from "../utils/errorHandler";

interface ShareLink {
  shareUrl: string;
  guest: {
    name: string;
    accessId: string;
  };
}

export function useGuests() {
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();

  function openGuestsModal() {
    setIsGuestsModalOpen(true);
    setShareLink(null); // Limpa o link anterior ao abrir o modal
  }

  function closeGuestsModal() {
    setIsGuestsModalOpen(false);
    setShareLink(null);
  }

  async function addNewGuest(
    event: FormEvent<HTMLFormElement>,
    tripId: string | null
  ) {
    event.preventDefault();

    if (!tripId) {
      showNotification(
        "É necessário criar uma viagem antes de adicionar convidados",
        "error"
      );
      return;
    }

    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const name = data.get("name")?.toString();

    if (!name) {
      showNotification("Digite o nome do convidado", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post<ShareLink>(`/trips/${tripId}/guests`, {
        name,
      });

      setShareLink(response.data);

      // Tenta resetar o formulário
      try {
        if (formElement && typeof formElement.reset === "function") {
          formElement.reset();
        }
      } catch (resetError) {
        console.warn("Não foi possível resetar o formulário:", resetError);
      }

      showNotification(`Convidado ${name} adicionado com sucesso`, "success");
    } catch (error) {
      handleError(error, {
        context: "adicionar convidado",
        fallbackMessage: `Não foi possível adicionar o convidado ${name}`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isGuestsModalOpen,
    shareLink,
    isLoading,
    openGuestsModal,
    closeGuestsModal,
    addNewGuest,
  };
}
