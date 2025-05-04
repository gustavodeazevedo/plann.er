import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Notification, NotificationType } from "./index";

interface NotificationContextData {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextData>({
  showNotification: () => {}, // Implementação padrão vazia
});

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [isVisible, setIsVisible] = useState(false);

  // Melhoria: Usar useCallback para evitar recriações desnecessárias
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      setMessage(message);
      setType(type);
      setIsVisible(true);
    },
    []
  );

  // Melhoria: Usar useCallback para evitar recriações desnecessárias
  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification
        type={type}
        message={message}
        isVisible={isVisible}
        onClose={handleClose}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  // Context agora sempre tem um valor padrão, então não precisamos verificar undefined
  return context;
}
