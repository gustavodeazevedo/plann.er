// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\hooks\useAuth.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSyncService } from "../lib/syncService";
import { useNotification } from "../components/Notification/context";

interface User {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Carregar dados do usuário ao inicializar
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("@planner:user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
          } else {
            // Se o usuário não tiver um ID, consideramos inválido
            console.error(
              "Dados de usuário inválidos encontrados no localStorage"
            );
            localStorage.removeItem("@planner:user");
          }
        } catch (parseError) {
          console.error("Erro ao analisar dados do usuário:", parseError);
          // Limpar dados corrompidos
          localStorage.removeItem("@planner:user");
        }
      }
    } catch (error) {
      console.error(
        "Erro ao acessar localStorage para dados do usuário:",
        error
      );
      // Não fazemos nada, apenas continuamos com user como null
    }
  }, []);

  function handleLogout() {
    try {
      // Não removemos dados do usuário atual, apenas removemos o token
      localStorage.removeItem("@planner:token");
      localStorage.removeItem("@planner:user");

      // Limpar os estados para não mostrar os dados da viagem atual após logout
      setUser(null);

      // Atualizar o ID do usuário no serviço de sincronização para null
      const syncService = getSyncService();
      syncService.updateUserId(null);

      navigate("/login");
      showNotification("Logout realizado com sucesso", "success");
    } catch (error) {
      console.error("Erro durante o logout:", error);
      // Tentamos garantir que o usuário seja deslogado mesmo com erro
      setUser(null);
      navigate("/login");
    }
  }

  return {
    user,
    setUser,
    handleLogout,
  };
}
