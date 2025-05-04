import { useState, useEffect } from "react";
import { api } from "../lib/axios";
import { Plus, Trash2, Check } from "lucide-react";
import { getSyncService } from "../lib/syncService";
import { useNotification } from "./Notification/context";

interface ChecklistItem {
  _id: string;
  tripId: string;
  text: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TripChecklistProps {
  tripId: string;
  isEditable: boolean;
}

export function TripChecklist({ tripId, isEditable }: TripChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Carregar itens do checklist
  useEffect(() => {
    async function loadChecklist() {
      // Evita fazer mais de 3 tentativas se continuar falhando
      if (retryCount > maxRetries) {
        setError(
          "Não foi possível carregar os itens do checklist após várias tentativas."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`Carregando checklist para viagem ${tripId}`);
        const response = await api.get(`/trips/${tripId}/checklist`);
        setItems(response.data.items);
        setError(null);
        // Reset do contador de tentativas quando bem-sucedido
        setRetryCount(0);
      } catch (err) {
        console.error("Erro ao carregar checklist:", err);
        // Incrementa contador de tentativas em caso de falha
        setRetryCount((prev) => prev + 1);
        setError("Não foi possível carregar os itens do checklist.");
      } finally {
        setIsLoading(false);
      }
    }

    if (tripId) {
      loadChecklist();
    }
  }, [tripId, retryCount, maxRetries]);

  // Adicionar novo item
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemText.trim()) {
      // Adicionando notificação mesmo quando o campo está vazio
      showNotification("O texto do item não pode estar vazio", "warning");
      return;
    }

    try {
      // Cria um ID temporário para feedback visual imediato
      const tempId = `temp-${Date.now()}`;
      const newItem: ChecklistItem = {
        _id: tempId,
        tripId,
        text: newItemText.trim(),
        checked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Atualiza a UI imediatamente
      setItems((prevItems) => [...prevItems, newItem]);
      setNewItemText("");

      // Exibe notificação de sucesso ao adicionar item
      showNotification(
        `Item "${newItem.text}" adicionado com sucesso!`,
        "success"
      );

      // Usa o serviço de sincronização para adicionar o item
      const syncService = getSyncService();
      syncService.addChecklistItem(
        tripId,
        { text: newItem.text },
        {
          onSuccess: (data) => {
            // Substitui o item temporário pelo item real retornado pelo servidor
            setItems((prevItems) =>
              prevItems.map((item) =>
                item._id === tempId ? (data as ChecklistItem) : item
              )
            );
          },
          onError: (error) => {
            console.error("Erro ao adicionar item:", error);
            showNotification(
              "Item será adicionado quando a conexão for reestabelecida",
              "warning"
            );
          },
        }
      );
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      setError("Não foi possível adicionar o item.");
      showNotification("Não foi possível adicionar o item", "error");
    }
  }

  // Marcar/desmarcar item
  async function handleToggleItem(id: string, checked: boolean) {
    try {
      // Obtém o item para mostrar na notificação
      const item = items.find((item) => item._id === id);

      // Verifica se o item existe
      if (!item) {
        showNotification("Item não encontrado para atualizar", "warning");
        return;
      }

      // Atualiza a UI imediatamente
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === id ? { ...item, checked: !checked } : item
        )
      );

      // Exibe notificação de acordo com o novo estado do item
      if (!checked) {
        showNotification(
          `Item "${item.text}" marcado como concluído!`,
          "success"
        );
      } else {
        showNotification(`Item "${item.text}" desmarcado!`, "info");
      }

      // Envia a atualização para o serviço de sincronização
      const syncService = getSyncService();
      syncService.updateChecklistItem(
        tripId,
        id,
        { checked: !checked },
        {
          onError: (error) => {
            console.error("Erro ao atualizar item:", error);
            // Reverte a mudança local se houver erro
            setItems((prevItems) =>
              prevItems.map((item) =>
                item._id === id ? { ...item, checked: checked } : item
              )
            );
            showNotification(
              "Não foi possível atualizar o item. Tente novamente.",
              "error"
            );
          },
        }
      );
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      setError("Não foi possível atualizar o item.");
      showNotification("Erro ao atualizar o status do item", "error");
    }
  }

  // Remover item
  async function handleRemoveItem(id: string) {
    try {
      // Guarda o item antes de remover para caso precise restaurar
      const itemToRemove = items.find((item) => item._id === id);

      if (!itemToRemove) {
        // Adicionando notificação mesmo quando o item não é encontrado
        showNotification("Item não encontrado para remoção", "warning");
        return;
      }

      // Remove da UI imediatamente
      setItems(items.filter((item) => item._id !== id));

      // Exibe notificação de item removido
      showNotification(`Item "${itemToRemove.text}" removido!`, "info");

      // Envia a remoção para o serviço de sincronização
      const syncService = getSyncService();
      syncService.removeChecklistItem(tripId, id, {
        onError: (error) => {
          console.error("Erro ao remover item:", error);
          // Restaura o item se houver erro
          if (itemToRemove) {
            setItems((prevItems) => [...prevItems, itemToRemove]);
          }
          showNotification(
            "Não foi possível remover o item. Tente novamente.",
            "error"
          );
        },
      });
    } catch (error) {
      console.error("Erro ao remover item:", error);
      setError("Não foi possível remover o item.");
      showNotification("Erro ao remover o item", "error");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Itens para levar</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
        </div>
      ) : (
        <>
          {isEditable && (
            <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Adicionar novo item..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <button
                type="submit"
                className="bg-lime-500 text-white rounded-md px-4 py-2 flex items-center gap-1 hover:bg-lime-600 transition-colors"
                disabled={!newItemText.trim()}
              >
                <Plus size={16} />
                Adicionar
              </button>
            </form>
          )}

          <ul className="space-y-2">
            {items.length === 0 ? (
              <li className="text-gray-500 text-center py-4">
                Nenhum item adicionado ainda.
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleItem(item._id, item.checked)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        item.checked ? "bg-lime-500" : "border border-gray-300"
                      }`}
                      disabled={!isEditable}
                    >
                      {item.checked && <Check size={12} color="white" />}
                    </button>
                    <span
                      className={`${
                        item.checked ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
