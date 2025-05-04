import { Check, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/axios";
import { useNotification } from "./Notification/context";
import "../styles/task-list.css";
import { syncService } from "../lib/syncService";
import { useErrorHandler } from "../utils/errorHandler";

interface Task {
  _id: string;
  description: string;
  completed: boolean;
  createdBy: string;
  createdAt: string;
}

interface TaskListProps {
  tripId: string;
  onTaskAdded?: () => void;
}

export function TaskList({ tripId, onTaskAdded }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();

  // Função aprimorada para buscar tarefas
  function fetchTasks() {
    if (!tripId) return;

    setIsLoading(true);
    console.log(`[TaskList] Buscando tarefas para tripId: ${tripId}`);

    api
      .get(`/trips/${tripId}`)
      .then((response) => {
        if (response.data && response.data.tasks) {
          console.log(
            `[TaskList] ${response.data.tasks.length} tarefas carregadas com sucesso`
          );
          setTasks(response.data.tasks);
        } else {
          console.warn(`[TaskList] Nenhuma tarefa encontrada na resposta`);
          setTasks([]);
        }
        setError(null);
      })
      .catch((error) => {
        console.error("[TaskList] Erro ao carregar tarefas:", error);
        handleError(error, {
          context: "carregar tarefas",
          showNotification: false, // Evitar mostrar notificação repetida
        });
        setError("Não foi possível carregar as tarefas.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  // Efeito simples que é executado apenas quando o tripId muda
  useEffect(() => {
    // Não carregar nada se não temos um ID
    if (!tripId) return;

    console.log(`[TaskList-Simples] Carregando tarefas para viagem ${tripId}`);

    // Carregar tarefas após um pequeno delay para evitar chamadas em sequência
    const timeoutId = setTimeout(fetchTasks, 300);

    // Configurar recarregamento automático a cada 2 minutos para garantir sincronização
    const intervalId = setInterval(() => {
      console.log(
        `[TaskList] Recarregando tarefas automaticamente para viagem ${tripId}`
      );
      fetchTasks();
    }, 120000); // 2 minutos

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [tripId]); // Apenas tripId como dependência

  // Adicionar nova tarefa
  function handleAddTask(e: FormEvent) {
    e.preventDefault();

    if (!newTaskDescription.trim()) {
      setError("Por favor, digite a descrição da tarefa.");
      showNotification("Por favor, digite a descrição da tarefa.", "error");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Criar uma tarefa temporária para atualização otimista da UI
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      _id: tempId,
      description: newTaskDescription,
      completed: false,
      createdBy: "",
      createdAt: new Date().toISOString(),
    };

    // Atualizar estado local imediatamente
    setTasks((prevTasks) => [...prevTasks, tempTask]);
    setNewTaskDescription("");

    // Salvar a tarefa no servidor
    syncService.addTask(tripId, newTaskDescription, {
      onSuccess: () => {
        // Recarregar as tarefas para obter o ID real
        fetchTasks();
        showNotification("Item adicionado com sucesso!", "success");
        if (onTaskAdded) {
          onTaskAdded();
        }
        setIsLoading(false);
      },
      onError: (error) => {
        handleError(error, {
          context: "adicionar tarefa",
          fallbackMessage: "Não foi possível adicionar o item.",
          showNotification: true,
        });
        setIsLoading(false);
      },
    });
  }

  // Atualizar status da tarefa
  function handleToggleTaskStatus(taskId: string, completed: boolean) {
    // Atualizar estado local imediatamente
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, completed: !completed } : task
      )
    );

    // Atualizar no servidor
    syncService.updateTask(tripId, taskId, !completed, {
      onSuccess: () => {
        showNotification(
          `Item marcado como ${!completed ? "concluído" : "pendente"}`,
          "success"
        );
      },
      onError: (error) => {
        // Reverter mudança em caso de erro
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? { ...task, completed: completed } : task
          )
        );

        handleError(error, {
          context: "atualizar tarefa",
          showNotification: true,
        });
      },
    });
  }

  // Remover tarefa
  function handleDeleteTask(taskId: string) {
    // Salvar estado atual para possível recuperação
    const previousTasks = [...tasks];

    // Atualizar estado local imediatamente
    setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

    // Remover no servidor
    syncService.deleteTask(tripId, taskId, {
      onSuccess: () => {
        showNotification("Item removido com sucesso.", "success");
      },
      onError: (error) => {
        // Reverter mudança em caso de erro
        setTasks(previousTasks);

        handleError(error, {
          context: "remover tarefa",
          showNotification: true,
        });
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-zinc-300">
            O que levar na viagem
          </h3>
          <button
            onClick={fetchTasks}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Sincronizar tarefas"
          >
            Sincronizar
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          Adicione itens que você não pode esquecer de levar
        </p>
      </div>

      {/* Formulário para adicionar nova tarefa */}
      <form
        onSubmit={handleAddTask}
        className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800"
      >
        <input
          type="text"
          placeholder="Adicionar um item..."
          className="bg-transparent text-zinc-100 placeholder-zinc-500 outline-none flex-1 text-sm p-1 task-input"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-lime-500 hover:bg-lime-400 text-lime-950 rounded-md p-1.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed add-task-button"
          disabled={isLoading || !newTaskDescription.trim()}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </form>

      {error && (
        <div className="flex items-center justify-between bg-red-950/30 text-red-300 p-2 rounded border border-red-800 text-xs">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 task-list-container">
        {tasks.length === 0 ? (
          <div className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 text-center">
            <p className="text-zinc-500 text-sm">Nenhum item adicionado</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 group task-item ${
                task.completed ? "completed" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() =>
                    handleToggleTaskStatus(task._id, task.completed)
                  }
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center task-checkbox ${
                    task.completed
                      ? "bg-lime-400 text-lime-950 checked"
                      : "border border-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </button>

                <p
                  className={`text-sm ${
                    task.completed
                      ? "line-through text-zinc-500"
                      : "text-zinc-200"
                  }`}
                >
                  {task.description}
                </p>
              </div>

              <button
                onClick={() => handleDeleteTask(task._id)}
                className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
