import { useState, useRef, ChangeEvent } from "react";
import { FileText, Upload, Trash2, X, Check, AlertCircle } from "lucide-react";
import { api } from "../lib/axios";
import { useNotification } from "./Notification/context";
import { useErrorHandler } from "../utils/errorHandler";

interface TicketUploadProps {
  tripId: string;
}

export function TicketUpload({ tripId }: TicketUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedTicket, setUploadedTicket] = useState<string | null>(null);
  const [uploadedTicketName, setUploadedTicketName] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();

  // Ao montar o componente, verificar se já existe um ticket para esta viagem
  useState(() => {
    async function loadTicket() {
      try {
        setIsLoading(true);
        const response = await api.get(`/trips/${tripId}/ticket`);

        if (response.data && response.data.ticketUrl) {
          setUploadedTicket(response.data.ticketUrl);
          setUploadedTicketName(response.data.ticketName || "Passagem.pdf");
        }
      } catch (error) {
        // Ignora erro se não encontrar ticket (pode ser que não tenha sido adicionado ainda)
        console.log("Nenhuma passagem encontrada para esta viagem");
      } finally {
        setIsLoading(false);
      }
    }

    if (tripId) {
      loadTicket();
    }
  }, [tripId]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Verificar se é um PDF
    if (file.type !== "application/pdf") {
      setError("Por favor, anexe apenas arquivos PDF.");
      showNotification("Por favor, anexe apenas arquivos PDF.", "error");
      return;
    }

    // Verificar tamanho (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5MB.");
      showNotification("O arquivo deve ter no máximo 5MB.", "error");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Criar FormData para upload do arquivo
      const formData = new FormData();
      formData.append("ticket", file);

      // Enviar para o servidor
      const response = await api.post(`/trips/${tripId}/ticket`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.ticketUrl) {
        setUploadedTicket(response.data.ticketUrl);
        setUploadedTicketName(file.name);
        showNotification("Passagem adicionada com sucesso!", "success");
      }
    } catch (error) {
      handleError(error, {
        context: "anexar passagem",
        fallbackMessage:
          "Não foi possível anexar a passagem. Por favor, tente novamente.",
      });
      setError(
        "Ocorreu um erro ao tentar anexar a passagem. Por favor, tente novamente."
      );
    } finally {
      setIsLoading(false);

      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm("Tem certeza que deseja remover esta passagem?")) return;

    try {
      setIsLoading(true);

      await api.delete(`/trips/${tripId}/ticket`);

      setUploadedTicket(null);
      setUploadedTicketName(null);
      showNotification("Passagem removida com sucesso!", "success");
    } catch (error) {
      handleError(error, {
        context: "remover passagem",
        fallbackMessage: "Não foi possível remover a passagem.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTicket = () => {
    if (uploadedTicket) {
      // Verificar se a URL já é absoluta (começa com http:// ou https://)
      if (
        uploadedTicket.startsWith("http://") ||
        uploadedTicket.startsWith("https://")
      ) {
        // URL já está completa (Supabase)
        window.open(uploadedTicket, "_blank");
      } else {
        // URL relativa, adicionar baseUrl (armazenamento local)
        const baseUrl = api.defaults.baseURL || "";
        const downloadUrl = `${baseUrl}${uploadedTicket}`;
        window.open(downloadUrl, "_blank");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-zinc-300">Passagem Aérea</h3>
        </div>
        <p className="text-sm text-zinc-500">
          Anexe sua passagem para ter acesso fácil durante sua viagem
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-950/30 text-red-300 p-3 rounded border border-red-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!uploadedTicket ? (
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <FileText size={36} className="text-zinc-500" />
            <p className="text-zinc-400 text-sm">
              Arraste o PDF da sua passagem aqui ou
            </p>
            <label
              htmlFor="ticket-upload"
              className="bg-lime-500 text-lime-950 rounded-md px-4 py-2 flex items-center gap-1 hover:bg-lime-400 transition-colors cursor-pointer font-medium mt-2"
            >
              <Upload size={16} />
              Selecionar arquivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="ticket-upload"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />
            <p className="text-zinc-500 text-xs mt-2">Apenas PDFs (max. 5MB)</p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center flex-1 gap-3 cursor-pointer hover:bg-zinc-700/50 p-2 rounded-lg transition-colors"
              onClick={handleViewTicket}
              title="Clique para visualizar a passagem"
            >
              <div className="bg-lime-500/20 p-2 rounded-lg">
                <FileText size={24} className="text-lime-300" />
              </div>
              <div className="flex-1">
                <p className="text-zinc-300 font-medium truncate">
                  {uploadedTicketName}
                </p>
                <p className="text-zinc-500 text-xs">Clique para visualizar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTicket}
                className="bg-zinc-700 hover:bg-red-700 p-2 rounded text-zinc-300"
                title="Remover passagem"
                disabled={isLoading}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
