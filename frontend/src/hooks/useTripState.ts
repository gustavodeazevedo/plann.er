import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api } from "../lib/axios";
import { getSyncService } from "../lib/syncService";
import { useNotification } from "../components/Notification/context";
import { useErrorHandler } from "../utils/errorHandler";
import { useLoading } from "../components/LoadingContext";

interface Trip {
  _id: string;
  destination: string;
  date: string;
  guests: string[];
  isDraft: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function useTripState() {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);
  const [isGuestsInputOpen, setIsGuestsInputOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { showNotification } = useNotification();
  const { handleError } = useErrorHandler();
  const { startLoading, stopLoading } = useLoading();

  // Referências para controle de salvamento
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef(false);
  const isSyncingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const lastSavedStateRef = useRef({ destination: "", date: "" });
  const saveCooldownRef = useRef(false);
  const lastTripIdRef = useRef<string | null>(null);

  // Função para obter uma chave de localStorage específica para o usuário atual
  const getUserSpecificKey = useCallback(
    (baseKey: string): string => {
      if (user?.id) {
        return `${baseKey}:${user.id}`;
      }
      return baseKey;
    },
    [user?.id]
  );

  // Carregar dados salvos ao iniciar a aplicação
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("@planner:user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Carregar estado da viagem atual para o usuário específico
          const userTripKey = `@planner:currentTrip:${parsedUser.id}`;
          const storedTripState = localStorage.getItem(userTripKey);
          if (storedTripState) {
            const tripState = JSON.parse(storedTripState);

            if (tripState.destination) {
              setDestination(tripState.destination);
              lastSavedStateRef.current.destination = tripState.destination;
            }
            if (tripState.date) {
              setDate(tripState.date);
              lastSavedStateRef.current.date = tripState.date;
            }
            if (tripState.createdTripId) {
              setCreatedTripId(tripState.createdTripId);
              lastTripIdRef.current = tripState.createdTripId;

              // Carregar detalhes completos da viagem do servidor
              // Isso vai garantir que os componentes TaskList e GuestList
              // tenham acesso aos dados atualizados
              setTimeout(() => {
                loadTripDetails(tripState.createdTripId);
              }, 500);

              // Se já temos um ID de viagem, verificamos qual etapa estava
              if (tripState.isGuestsInputOpen) {
                setIsGuestsInputOpen(true);
              }
              if (tripState.isTaskListOpen) {
                setIsTaskListOpen(true);
              }
              if (tripState.isEditing) {
                setIsEditing(true);
              }
            }
          }
        } catch (error) {
          handleError(error, {
            context: "carregar dados salvos",
            fallbackMessage: "Não foi possível recuperar seus dados salvos",
          });
        }
      }

      // Marcar que a carga inicial foi concluída
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      isInitialLoadRef.current = false;
    }
  }, [handleError]);

  // Função para salvar o estado atual no localStorage de forma segura
  const saveToLocalStorage = useCallback(() => {
    if (!user?.id) return;

    try {
      const currentTripState = {
        destination,
        date,
        createdTripId,
        isGuestsInputOpen,
        isTaskListOpen,
        isEditing,
      };

      const userTripKey = getUserSpecificKey("@planner:currentTrip");
      localStorage.setItem(userTripKey, JSON.stringify(currentTripState));
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }
  }, [
    user?.id,
    destination,
    date,
    createdTripId,
    isGuestsInputOpen,
    isTaskListOpen,
    isEditing,
    getUserSpecificKey,
  ]);

  // Função para salvar o estado atual no servidor de forma controlada
  const saveCurrentTripToServer = useCallback(() => {
    // Se já estamos processando um salvamento, apenas marcar pendência
    if (isSyncingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // Se não temos um ID ou não temos dados para salvar, não fazemos nada
    if (!createdTripId || !destination || !date) {
      return;
    }

    // Se o ID da viagem mudou, não tentamos salvar a anterior
    if (lastTripIdRef.current !== createdTripId) {
      console.log(`[TripState] ID da viagem mudou, não salvando a anterior`);
      lastTripIdRef.current = createdTripId;
      return;
    }

    // Se os dados não mudaram, não salvar
    if (
      lastSavedStateRef.current.destination === destination &&
      lastSavedStateRef.current.date === date
    ) {
      console.log(`[TripState] Dados não mudaram, ignorando salvamento`);
      return;
    }

    // Se estamos em período de cooldown, agendar para mais tarde
    if (saveCooldownRef.current) {
      // Limpar timeout existente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Agendar para 3 segundos depois
      saveTimeoutRef.current = setTimeout(() => {
        saveCurrentTripToServer();
      }, 3000) as unknown as number;
      return;
    }

    // Marcar início da sincronização
    isSyncingRef.current = true;
    pendingSaveRef.current = false;
    saveCooldownRef.current = true;

    // Capturar dados atuais
    const currentDestination = destination;
    const currentDate = date;
    const thisTripId = createdTripId;

    console.log("[TripState] Salvando viagem no servidor:", {
      id: thisTripId,
      destination: currentDestination,
      date: currentDate,
    });

    try {
      const syncService = getSyncService();
      syncService.saveTrip(
        thisTripId,
        {
          destination: currentDestination,
          date: currentDate,
          isDraft: true,
        },
        {
          onSuccess: () => {
            // Verificar se o ID da viagem ainda é o mesmo (evita salvar viagem antiga)
            if (thisTripId !== createdTripId) {
              console.log(`[TripState] ID da viagem mudou, ignorando resposta`);
              isSyncingRef.current = false;
              saveCooldownRef.current = false;
              return;
            }

            // Atualizar o último estado salvo
            lastSavedStateRef.current = {
              destination: currentDestination,
              date: currentDate,
            };

            // Finalizar salvamento
            isSyncingRef.current = false;

            // Iniciar período de cooldown para evitar salvamentos frequentes
            setTimeout(() => {
              saveCooldownRef.current = false;

              // Se houver outro salvamento pendente, processar após o cooldown
              if (pendingSaveRef.current) {
                saveCurrentTripToServer();
              }
            }, 5000); // 5 segundos de cooldown

            console.log("[TripState] Viagem salva com sucesso");
          },
          onError: (error) => {
            handleError(error, {
              context: "sincronizar viagem",
              showNotification: false,
            });

            // Finalizar salvamento mesmo com erro
            isSyncingRef.current = false;

            // Período de cooldown menor para erros
            setTimeout(() => {
              saveCooldownRef.current = false;

              // Se houver outro salvamento pendente, processar após o cooldown
              if (pendingSaveRef.current) {
                saveCurrentTripToServer();
              }
            }, 10000); // 10 segundos de cooldown após erro

            console.error("[TripState] Erro ao salvar viagem:", error);
          },
        }
      );
    } catch (error) {
      handleError(error, {
        context: "inicializar sincronização",
        showNotification: false,
      });

      // Finalizar salvamento mesmo com erro
      isSyncingRef.current = false;

      // Período de cooldown menor para erros
      setTimeout(() => {
        saveCooldownRef.current = false;
      }, 10000);
    }
  }, [createdTripId, destination, date, handleError]);

  // Função para carregar dados detalhados da viagem a partir do ID
  const loadTripDetails = useCallback(
    async (tripId: string) => {
      if (!tripId) return;

      console.log(`[useTripState] Carregando detalhes da viagem ${tripId}`);

      try {
        // Carregar dados completos da viagem
        const response = await api.get(`/trips/${tripId}`);

        if (response.data) {
          console.log(
            `[useTripState] Detalhes da viagem ${tripId} carregados com sucesso`,
            {
              destination: response.data.destination,
              date: response.data.date,
              tasksCount: response.data.tasks?.length || 0,
            }
          );

          // Não precisamos fazer nada aqui, pois os componentes TaskList e GuestList
          // já vão carregar suas respectivas partes a partir do tripId
        }
      } catch (error) {
        console.error(
          `[useTripState] Erro ao carregar detalhes da viagem ${tripId}:`,
          error
        );
        handleError(error, {
          context: "carregar detalhes da viagem",
          showNotification: false, // Não mostrar notificação para não assustar o usuário
        });
      }
    },
    [handleError]
  );

  // Persistir alterações no localStorage
  useEffect(() => {
    // Não salvar durante a carga inicial e só salvar se temos um usuário
    if (isInitialLoadRef.current || !user?.id) return;

    // Salvar no localStorage sempre que houver mudanças
    saveToLocalStorage();
  }, [
    destination,
    date,
    createdTripId,
    isGuestsInputOpen,
    isTaskListOpen,
    isEditing,
    user,
    saveToLocalStorage,
  ]);

  // Efeito separado para salvar no servidor com debounce
  useEffect(() => {
    // Não salvar durante a carga inicial
    if (isInitialLoadRef.current) return;

    // Só salvar se temos um ID de viagem
    if (!createdTripId) return;

    // Atualizar a referência ao último tripId
    lastTripIdRef.current = createdTripId;

    // Limpar qualquer timeout existente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Configurar um novo timeout para debounce
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentTripToServer();
    }, 2000) as unknown as number; // 2 segundos de debounce

    // Limpar timeout quando o componente desmontar
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [destination, date, createdTripId, saveCurrentTripToServer]);

  const openGuestsInput = useCallback(() => {
    setIsGuestsInputOpen(true);
    // Não fechamos mais a lista de tarefas ao abrir os convidados
    // setIsTaskListOpen(false);
  }, []);

  const closeGuestsInput = useCallback(() => {
    setIsGuestsInputOpen(false);
  }, []);

  const openTaskList = useCallback(() => {
    setIsTaskListOpen(true);
    // Não fechamos mais a seção de convidados ao abrir a lista de tarefas
    // setIsGuestsInputOpen(false);
  }, []);

  const closeTaskList = useCallback(() => {
    setIsTaskListOpen(false);
  }, []);

  const startNewTrip = useCallback(() => {
    try {
      // Pergunta ao usuário se ele realmente quer iniciar uma nova viagem
      if (destination || date || createdTripId) {
        if (
          !confirm(
            "Deseja iniciar uma nova viagem? Os dados não salvos serão perdidos."
          )
        ) {
          return;
        }
      }

      setDestination("");
      setDate("");
      setCreatedTripId(null);
      setIsGuestsInputOpen(false);
      setIsTaskListOpen(false);
      setIsEditing(false);

      // Remover o estado atual da viagem do localStorage para este usuário
      if (user?.id) {
        const userTripKey = getUserSpecificKey("@planner:currentTrip");
        localStorage.removeItem(userTripKey);
      }

      showNotification("Nova viagem iniciada!", "success");
    } catch (error) {
      console.error("Erro ao iniciar nova viagem:", error);
      showNotification("Erro ao iniciar nova viagem", "error");
    }
  }, [
    destination,
    date,
    createdTripId,
    user?.id,
    getUserSpecificKey,
    showNotification,
  ]);

  const handleSaveTrip = useCallback(
    async (isDraft: boolean = false) => {
      if (!destination || !date) {
        showNotification(
          "Preencha o destino e a data antes de salvar!",
          "error"
        );
        return;
      }

      startLoading();
      setIsLoading(true);

      try {
        let response;

        // Se já temos um ID de viagem, atualizar em vez de criar uma nova
        if (createdTripId) {
          response = await api.patch<Trip>(`/trips/${createdTripId}`, {
            destination,
            date,
            isDraft,
          });
          console.log("[TripState] Viagem atualizada:", response.data);
        } else {
          // Criar uma nova viagem
          response = await api.post<Trip>("/trips", {
            destination,
            date,
            isDraft,
          });
          console.log("[TripState] Nova viagem criada:", response.data);

          // Definir o ID da viagem recém-criada
          setCreatedTripId(response.data._id);
        }

        if (isDraft) {
          // Se estamos concluindo a edição, desativar o modo de edição
          if (isEditing) {
            setIsEditing(false);
          }

          // Após criar/atualizar a viagem, atualize o localStorage
          setTimeout(() => {
            saveToLocalStorage();
          }, 100);

          return response.data;
        } else {
          showNotification("Viagem confirmada com sucesso!", "success");
        }

        return response.data;
      } catch (error) {
        handleError(error, {
          context: "salvar viagem",
        });
        return null;
      } finally {
        setIsLoading(false);
        stopLoading();
      }
    },
    [
      destination,
      date,
      createdTripId,
      isEditing,
      showNotification,
      startLoading,
      stopLoading,
      handleError,
      saveToLocalStorage,
    ]
  );

  // Use useMemo para criar o objeto de retorno para evitar recriações desnecessárias
  const tripState = useMemo(() => {
    return {
      destination,
      setDestination,
      date,
      setDate,
      isLoading,
      createdTripId,
      isGuestsInputOpen,
      isTaskListOpen,
      isEditing,
      setIsEditing,
      user,
      setUser,
      openGuestsInput,
      closeGuestsInput,
      openTaskList,
      closeTaskList,
      startNewTrip,
      handleSaveTrip,
    };
  }, [
    destination,
    date,
    isLoading,
    createdTripId,
    isGuestsInputOpen,
    isTaskListOpen,
    isEditing,
    user,
    openGuestsInput,
    closeGuestsInput,
    openTaskList,
    closeTaskList,
    startNewTrip,
    handleSaveTrip,
  ]);

  return tripState;
}
