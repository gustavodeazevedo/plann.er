import { api } from "./axios";

interface SyncCallbacks {
  onSuccess?: (data?: unknown) => void; // Corrigido o tipo any
  onError?: (error: unknown) => void; // Corrigido o tipo any
  onOffline?: () => void;
}

interface PendingAction {
  type: "add" | "update" | "delete";
  tripId: string;
  taskId?: string;
  description?: string;
  completed?: boolean;
  checklistId?: string; // Adicionado suporte para checklist
  checklistText?: string; // Adicionado suporte para checklist
  checklistChecked?: boolean; // Adicionado suporte para checklist
  guestName?: string; // Adicionado suporte para convidado
  guestId?: string; // Adicionado suporte para atualizar/deletar convidado
  callbacks: SyncCallbacks;
  timestamp: number;
  retryCount: number;
}

interface TripData {
  destination: string;
  date: string;
  isDraft?: boolean;
}

/**
 * Gerencia a sincronização de tarefas com o servidor, permitindo
 * operações offline com sincronização automática quando a conexão é restaurada
 */
class SyncService {
  private pendingActions: PendingAction[] = [];
  private syncInterval: number | null = null; // Corrigido o tipo NodeJS.Timeout
  private maxRetries = 5;
  // private retryInterval = 10000; // removido pois não é usado
  private isOnline = navigator.onLine;
  private isCurrentlySyncing = false;
  // private userId: string | null = null; // removido pois não é usado

  // Adicionar controle para evitar requisições duplicadas
  private lastTripSaveTimestamp: Record<string, number> = {};
  private saveTripCooldown = 3000; // 3 segundos entre salvamentos da mesma viagem
  private inProgressSaves: Set<string> = new Set();

  // Adicionar controle para evitar requisições duplicadas para checklist
  private inProgressChecklistOperations: Set<string> = new Set();
  private inProgressGuestOperations: Set<string> = new Set();

  constructor() {
    // Inicializar com ações pendentes do localStorage
    this.loadPendingActions();

    // Configurar listeners de status de rede
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Iniciar o intervalo de sincronização
    this.startSyncInterval();
  }

  /**
   * Inicializa o intervalo de sincronização periódica
   */
  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (!this.isCurrentlySyncing && this.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    }, 30000) as unknown as number; // Corrigido o tipo
  }

  /**
   * Manipula o evento de retorno da conexão
   */
  private handleOnline = () => {
    this.isOnline = true;
    console.log("[SyncService] Conexão restabelecida, iniciando sincronização");

    // Evita iniciar sincronização se já estiver sincronizando
    if (!this.isCurrentlySyncing && this.pendingActions.length > 0) {
      this.syncPendingActions();
    }
  };

  /**
   * Manipula o evento de perda de conexão
   */
  private handleOffline = () => {
    this.isOnline = false;
    console.log("[SyncService] Conexão perdida, operando em modo offline");
  };

  /**
   * Carrega ações pendentes do localStorage
   */
  private loadPendingActions() {
    try {
      const saved = localStorage.getItem("pendingActions");
      if (!saved) {
        this.pendingActions = [];
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.pendingActions = parsed;
          console.log(
            `[SyncService] ${this.pendingActions.length} ações pendentes carregadas`
          );
        } else {
          console.error("[SyncService] Formato inválido de ações pendentes");
          this.pendingActions = [];
          localStorage.removeItem("pendingActions");
        }
      } catch (parseError) {
        console.error(
          "[SyncService] Erro ao analisar ações pendentes:",
          parseError
        );
        this.pendingActions = [];
        localStorage.removeItem("pendingActions");
      }
    } catch (error) {
      console.error("[SyncService] Erro ao acessar localStorage:", error);
      this.pendingActions = [];
    }
  }

  /**
   * Salva ações pendentes no localStorage
   */
  private savePendingActions() {
    try {
      localStorage.setItem(
        "pendingActions",
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error("[SyncService] Erro ao salvar ações pendentes:", error);
    }
  }

  /**
   * Atualiza o ID do usuário atual
   */
  updateUserId(id: string | null) {
    // this.userId = id; // removido pois não é usado
  }

  /**
   * Sincroniza todas as ações pendentes com o servidor
   */
  async syncPendingActions() {
    // Evita chamadas simultâneas ou quando não há conexão
    if (
      !this.isOnline ||
      this.isCurrentlySyncing ||
      this.pendingActions.length === 0
    ) {
      return;
    }

    this.isCurrentlySyncing = true;
    console.log(
      `[SyncService] Sincronizando ${this.pendingActions.length} ações pendentes`
    );

    // Ordenar por timestamp (mais antigos primeiro)
    const actions = [...this.pendingActions].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const completedActionIds: number[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      try {
        switch (action.type) {
          case "add":
            if (action.description) {
              // Tarefa regular
              await api.post(`/trips/${action.tripId}/tasks`, {
                description: action.description,
              });
            } else if (action.checklistText) {
              // Item de checklist
              const response = await api.post(
                `/trips/${action.tripId}/checklist`,
                {
                  text: action.checklistText,
                }
              );
              // Passa os dados retornados pelo servidor para o callback
              action.callbacks.onSuccess?.(response.data);
            } else if (action.guestName) {
              // Convidado
              const response = await api.post(
                `/trips/${action.tripId}/guests`,
                {
                  name: action.guestName,
                }
              );
              action.callbacks.onSuccess?.(response.data);
            }
            break;

          case "update":
            if (action.taskId !== undefined && action.completed !== undefined) {
              // Atualização de tarefa - corrigindo o endpoint para usar PUT com taskId na URL
              await api.put(`/trips/${action.tripId}/tasks/${action.taskId}`, {
                completed: action.completed,
              });
            } else if (
              action.checklistId &&
              action.checklistChecked !== undefined
            ) {
              // Atualização de item de checklist
              const response = await api.patch(
                `/trips/${action.tripId}/checklist/${action.checklistId}`,
                {
                  checked: action.checklistChecked,
                }
              );
              action.callbacks.onSuccess?.(response.data);
            } else if (action.guestId && action.guestName) {
              // Atualização de convidado
              const response = await api.put(
                `/trips/${action.tripId}/guests/${action.guestId}`,
                {
                  name: action.guestName,
                }
              );
              action.callbacks.onSuccess?.(response.data);
            }
            break;

          case "delete":
            if (action.taskId) {
              // Deleção de tarefa - corrigindo o endpoint para usar DELETE com taskId na URL
              await api.delete(
                `/trips/${action.tripId}/tasks/${action.taskId}`
              );
            } else if (action.checklistId) {
              // Deleção de item de checklist
              await api.delete(
                `/trips/${action.tripId}/checklist/${action.checklistId}`
              );
              action.callbacks.onSuccess?.();
            } else if (action.guestId) {
              // Deleção de convidado
              await api.delete(
                `/trips/${action.tripId}/guests/${action.guestId}`
              );
              action.callbacks.onSuccess?.();
            }
            break;
        }

        // Se não tiver chamado o callback específico acima, chama o genérico
        if (
          !action.checklistId &&
          !action.checklistText &&
          !action.guestName &&
          !action.guestId
        ) {
          action.callbacks.onSuccess?.();
        }

        completedActionIds.push(i);
      } catch (error) {
        console.error(
          `[SyncService] Erro ao sincronizar ação ${action.type}:`,
          error
        );

        // Incrementar contador de tentativas
        action.retryCount++;

        // Se excedeu o número máximo de tentativas, desistir
        if (action.retryCount > this.maxRetries) {
          console.error(
            `[SyncService] Máximo de tentativas excedido para ação ${action.type}`
          );
          action.callbacks.onError?.(error);
          completedActionIds.push(i);
        } else {
          action.callbacks.onError?.(error);
        }
      }
    }

    // Remover ações completadas (em ordem reversa para não afetar os índices)
    for (let i = completedActionIds.length - 1; i >= 0; i--) {
      this.pendingActions.splice(completedActionIds[i], 1);
    }

    // Salvar o estado atualizado
    this.savePendingActions();
    this.isCurrentlySyncing = false;
  }

  /**
   * Adiciona uma ação à fila de sincronização
   */
  private addPendingAction(
    action: Omit<PendingAction, "timestamp" | "retryCount">
  ) {
    const fullAction: PendingAction = {
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingActions.push(fullAction);
    this.savePendingActions();

    // Se estivermos online, tentar sincronizar imediatamente
    if (this.isOnline && !this.isCurrentlySyncing) {
      setTimeout(() => this.syncPendingActions(), 0);
    } else if (!this.isOnline) {
      action.callbacks.onOffline?.();
    }
  }

  /**
   * Adiciona uma nova tarefa
   */
  addTask(tripId: string, description: string, callbacks: SyncCallbacks = {}) {
    this.addPendingAction({
      type: "add",
      tripId,
      description,
      callbacks,
    });
  }

  /**
   * Atualiza o status de uma tarefa
   */
  updateTask(
    tripId: string,
    taskId: string,
    completed: boolean,
    callbacks: SyncCallbacks = {}
  ) {
    this.addPendingAction({
      type: "update",
      tripId,
      taskId,
      completed,
      callbacks,
    });
  }

  /**
   * Remove uma tarefa
   */
  deleteTask(tripId: string, taskId: string, callbacks: SyncCallbacks = {}) {
    this.addPendingAction({
      type: "delete",
      tripId,
      taskId,
      callbacks,
    });
  }

  /**
   * Métodos específicos para o gerenciamento do checklist
   */

  /**
   * Adiciona um novo item ao checklist
   */
  addChecklistItem(
    tripId: string,
    data: { text: string },
    callbacks: SyncCallbacks = {}
  ) {
    // Cria uma chave única para esta operação
    const operationKey = `add-${tripId}-${Date.now()}`;

    // Verifica se já está em andamento
    if (this.inProgressChecklistOperations.has(operationKey)) {
      return;
    }

    this.inProgressChecklistOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .post(`/trips/${tripId}/checklist`, { text: data.text })
        .then((response) => {
          callbacks.onSuccess?.(response.data);
          this.inProgressChecklistOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error(
            "[SyncService] Erro ao adicionar item ao checklist:",
            error
          );
          callbacks.onError?.(error);
          this.inProgressChecklistOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "add",
              tripId,
              checklistText: data.text,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "add",
        tripId,
        checklistText: data.text,
        callbacks,
      });
      this.inProgressChecklistOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Atualiza um item do checklist
   */
  updateChecklistItem(
    tripId: string,
    checklistId: string,
    data: { checked: boolean },
    callbacks: SyncCallbacks = {}
  ) {
    // Cria uma chave única para esta operação
    const operationKey = `update-${tripId}-${checklistId}`;

    // Verifica se já está em andamento
    if (this.inProgressChecklistOperations.has(operationKey)) {
      return;
    }

    this.inProgressChecklistOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .patch(`/trips/${tripId}/checklist/${checklistId}`, {
          checked: data.checked,
        })
        .then((response) => {
          callbacks.onSuccess?.(response.data);
          this.inProgressChecklistOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error(
            "[SyncService] Erro ao atualizar item do checklist:",
            error
          );
          callbacks.onError?.(error);
          this.inProgressChecklistOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "update",
              tripId,
              checklistId,
              checklistChecked: data.checked,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "update",
        tripId,
        checklistId,
        checklistChecked: data.checked,
        callbacks,
      });
      this.inProgressChecklistOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Remove um item do checklist
   */
  removeChecklistItem(
    tripId: string,
    checklistId: string,
    callbacks: SyncCallbacks = {}
  ) {
    // Cria uma chave única para esta operação
    const operationKey = `delete-${tripId}-${checklistId}`;

    // Verifica se já está em andamento
    if (this.inProgressChecklistOperations.has(operationKey)) {
      return;
    }

    this.inProgressChecklistOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .delete(`/trips/${tripId}/checklist/${checklistId}`)
        .then(() => {
          callbacks.onSuccess?.();
          this.inProgressChecklistOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error(
            "[SyncService] Erro ao remover item do checklist:",
            error
          );
          callbacks.onError?.(error);
          this.inProgressChecklistOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "delete",
              tripId,
              checklistId,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "delete",
        tripId,
        checklistId,
        callbacks,
      });
      this.inProgressChecklistOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Adiciona um novo convidado
   */
  addGuest(tripId: string, guestName: string, callbacks: SyncCallbacks = {}) {
    // Cria uma chave única para esta operação
    const operationKey = `add-guest-${tripId}-${Date.now()}`;

    // Verifica se já está em andamento
    if (this.inProgressGuestOperations.has(operationKey)) {
      return;
    }

    this.inProgressGuestOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .post(`/trips/${tripId}/guests`, { name: guestName })
        .then((response) => {
          callbacks.onSuccess?.(response.data);
          this.inProgressGuestOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error("[SyncService] Erro ao adicionar convidado:", error);
          callbacks.onError?.(error);
          this.inProgressGuestOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "add",
              tripId,
              guestName,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "add",
        tripId,
        guestName,
        callbacks,
      });
      this.inProgressGuestOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Atualiza um convidado existente
   */
  updateGuest(
    tripId: string,
    guestId: string,
    guestName: string,
    callbacks: SyncCallbacks = {}
  ) {
    // Cria uma chave única para esta operação
    const operationKey = `update-guest-${tripId}-${guestId}`;

    // Verifica se já está em andamento
    if (this.inProgressGuestOperations.has(operationKey)) {
      return;
    }

    this.inProgressGuestOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .put(`/trips/${tripId}/guests/${guestId}`, { name: guestName })
        .then((response) => {
          callbacks.onSuccess?.(response.data);
          this.inProgressGuestOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error("[SyncService] Erro ao atualizar convidado:", error);
          callbacks.onError?.(error);
          this.inProgressGuestOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "update",
              tripId,
              guestId,
              guestName,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "update",
        tripId,
        guestId,
        guestName,
        callbacks,
      });
      this.inProgressGuestOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Remove um convidado
   */
  deleteGuest(tripId: string, guestId: string, callbacks: SyncCallbacks = {}) {
    // Cria uma chave única para esta operação
    const operationKey = `delete-guest-${tripId}-${guestId}`;

    // Verifica se já está em andamento
    if (this.inProgressGuestOperations.has(operationKey)) {
      return;
    }

    this.inProgressGuestOperations.add(operationKey);

    if (this.isOnline) {
      // Se estiver online, fazer a requisição diretamente
      api
        .delete(`/trips/${tripId}/guests/${guestId}`)
        .then(() => {
          callbacks.onSuccess?.();
          this.inProgressGuestOperations.delete(operationKey);
        })
        .catch((error) => {
          console.error("[SyncService] Erro ao remover convidado:", error);
          callbacks.onError?.(error);
          this.inProgressGuestOperations.delete(operationKey);

          // Se for um erro de conexão, adicionar à fila de pendências
          if (!navigator.onLine || error.message.includes("network")) {
            this.addPendingAction({
              type: "delete",
              tripId,
              guestId,
              callbacks,
            });
          }
        });
    } else {
      // Se estiver offline, adicionar à fila de pendências
      this.addPendingAction({
        type: "delete",
        tripId,
        guestId,
        callbacks,
      });
      this.inProgressGuestOperations.delete(operationKey);
      callbacks.onOffline?.();
    }
  }

  /**
   * Salva ou atualiza uma viagem
   */
  saveTrip(tripId: string, data: TripData, callbacks: SyncCallbacks = {}) {
    // Verificar se já estamos em processo de salvar esta viagem
    if (this.inProgressSaves.has(tripId)) {
      console.log(
        `[SyncService] Já existe um salvamento em andamento para viagem ${tripId}`
      );
      return;
    }

    // Verificar cooldown para evitar requisições repetidas
    const now = Date.now();
    const lastSave = this.lastTripSaveTimestamp[tripId] || 0;
    if (now - lastSave < this.saveTripCooldown) {
      console.log(`[SyncService] Aguardando cooldown para viagem ${tripId}`);
      // Podemos adicionar um timeout para tentar novamente após o cooldown
      setTimeout(() => {
        this.saveTrip(tripId, data, callbacks);
      }, this.saveTripCooldown);
      return;
    }

    // Marcar que estamos iniciando um salvamento
    this.inProgressSaves.add(tripId);
    this.lastTripSaveTimestamp[tripId] = now;

    try {
      console.log(`[SyncService] Salvando viagem ${tripId}`);

      // CORREÇÃO: Trocando PUT por PATCH para corresponder à rota do backend
      api
        .patch(`/trips/${tripId}`, data)
        .then(() => {
          console.log(`[SyncService] Viagem ${tripId} salva com sucesso`);
          callbacks.onSuccess?.();
          this.inProgressSaves.delete(tripId);
        })
        .catch((error) => {
          console.error(
            `[SyncService] Erro ao salvar viagem ${tripId}:`,
            error
          );
          callbacks.onError?.(error);
          this.inProgressSaves.delete(tripId);

          // Se for um erro específico de conflito ou concorrência, aumentamos o cooldown
          if (
            error.response &&
            (error.response.status === 409 || error.response.status === 429)
          ) {
            this.lastTripSaveTimestamp[tripId] = Date.now() + 10000; // Adiciona 10s extra de cooldown
          }
        });
    } catch (error) {
      console.error(
        `[SyncService] Erro ao iniciar requisição para viagem ${tripId}:`,
        error
      );
      callbacks.onError?.(error);
      this.inProgressSaves.delete(tripId);
    }
  }

  /**
   * Retorna o número de ações pendentes
   */
  getPendingActionsCount() {
    return this.pendingActions.length;
  }

  /**
   * Verifica se há alguma ação pendente para uma viagem específica
   */
  hasPendingActions(tripId: string) {
    return this.pendingActions.some((action) => action.tripId === tripId);
  }

  /**
   * Limpa o serviço ao desmontar o componente
   */
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  /**
   * Inicializa o serviço quando o usuário faz login ou retorna à aplicação
   */
  initialize(userId: string | null) {
    this.updateUserId(userId);

    // Limpar ações pendentes desatualizadas (mais de 24 horas)
    this.cleanupOldPendingActions();

    // Verificar se há ações pendentes para sincronizar
    if (this.isOnline && this.pendingActions.length > 0) {
      console.log(
        `[SyncService] Inicializando com ${this.pendingActions.length} ações pendentes`
      );
      setTimeout(() => this.syncPendingActions(), 3000); // Atrasa a sincronização inicial em 3 segundos
    }
  }

  /**
   * Limpa ações pendentes antigas que não foram concluídas
   */
  private cleanupOldPendingActions() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 horas em ms

    this.pendingActions = this.pendingActions.filter((action) => {
      return now - action.timestamp < twentyFourHours;
    });

    this.savePendingActions();
  }
}

// Instância singleton
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

// Para compatibilidade com código existente
export const syncService = getSyncService();
