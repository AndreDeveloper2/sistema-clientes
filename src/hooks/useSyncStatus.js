import { useState, useEffect } from "react";
import { initializeSync } from "@/lib/firebaseSync";
import { isFirebaseConfigured } from "@/lib/firebase";

/**
 * Hook para gerenciar o status de sincronização
 * Retorna o status atual e se a sincronização foi concluída
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState("offline");
  const [isSynced, setIsSynced] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Se Firebase não estiver configurado, considerar como sincronizado (usa LocalStorage)
    if (!isFirebaseConfigured()) {
      setSyncStatus("offline");
      setIsSynced(true); // LocalStorage já está disponível
      return;
    }

    // Verificar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
      setIsSynced(true); // Se offline, usar dados locais
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Inicializar sincronização se estiver online
    if (isOnline) {
      setSyncStatus("syncing");
      setIsSynced(false);
      
      initializeSync((status) => {
        setSyncStatus(status);
        if (status === "synced") {
          setIsSynced(true);
        } else if (status === "error") {
          // Em caso de erro, usar dados locais mesmo assim
          setIsSynced(true);
        }
      })
        .then(() => {
          // Listener já foi configurado dentro de initializeSync
        })
        .catch((error) => {
          console.error("Erro ao inicializar sincronização:", error);
          setSyncStatus("error");
          setIsSynced(true); // Usar dados locais em caso de erro
        });
    } else {
      // Se offline, usar dados locais
      setIsSynced(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]);

  return { syncStatus, isSynced, isOnline };
}

