import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { useClienteStore } from "@/stores/clienteStore";
import { useServidorStore } from "@/stores/servidorStore";
import { useLogStore } from "@/stores/logStore";
import { calcularStatus, calcularDiasRestantes } from "@/lib/clienteUtils";

// IDs das coleções no Firestore
const CLIENTES_COLLECTION = "clientes";
const SERVIDORES_COLLECTION = "servidores";
const LOGS_COLLECTION = "logs";
const USER_ID = "default-user"; // Você pode mudar isso para usar autenticação do Firebase

// Flag para evitar loops de sincronização
let isSyncing = false;
// Flag para indicar se a quota foi excedida
let quotaExceeded = false;

/**
 * Sincroniza todos os clientes do LocalStorage para o Firestore
 */
export const syncClientesToFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização.");
    return;
  }

  if (isSyncing || quotaExceeded) return;

  try {
    isSyncing = true;
    const clientes = useClienteStore.getState().clientes;

    // Sincronizar cada cliente
    const promises = clientes.map(async (cliente) => {
      const clienteRef = doc(
        db,
        CLIENTES_COLLECTION,
        `${USER_ID}_${cliente.id}`
      );
      await setDoc(
        clienteRef,
        {
          ...cliente,
          userId: USER_ID,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await Promise.all(promises);
    console.log("Clientes sincronizados com Firebase");
  } catch (error) {
    // Verificar se é erro de quota excedida
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
      console.warn("Para continuar usando Firebase, atualize para o plano Blaze ou aguarde o reset da quota.");
    } else {
    console.error("Erro ao sincronizar clientes:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando offline
  } finally {
    isSyncing = false;
  }
};

/**
 * Sincroniza todos os servidores do LocalStorage para o Firestore
 */
export const syncServidoresToFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização.");
    return;
  }

  if (isSyncing) return;

  try {
    isSyncing = true;
    const servidores = useServidorStore.getState().servidores;

    // Sincronizar cada servidor
    const promises = servidores.map(async (servidor) => {
      const servidorRef = doc(
        db,
        SERVIDORES_COLLECTION,
        `${USER_ID}_${servidor.id}`
      );
      await setDoc(
        servidorRef,
        {
          ...servidor,
          userId: USER_ID,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await Promise.all(promises);
    console.log("Servidores sincronizados com Firebase");
  } catch (error) {
    console.error("Erro ao sincronizar servidores:", error);
    throw error;
  } finally {
    isSyncing = false;
  }
};

/**
 * Busca todos os clientes do Firestore e atualiza o LocalStorage
 */
export const syncClientesFromFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização.");
    return [];
  }

  if (isSyncing || quotaExceeded) return [];

  try {
    isSyncing = true;
    const q = query(
      collection(db, CLIENTES_COLLECTION),
      where("userId", "==", USER_ID)
    );
    const querySnapshot = await getDocs(q);

    const clientes = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Remover userId e updatedAt antes de salvar
      const { userId, updatedAt, ...cliente } = data;
      // Recalcular status e dias restantes apenas se não for inadimplente
      if (cliente.situacao !== "INADIMPLENTE") {
      cliente.diasRestantes = calcularDiasRestantes(cliente.dataVencimento);
      cliente.status = calcularStatus(
        cliente.dataVencimento,
        cliente.diasRestantes
      );
      }
      clientes.push(cliente);
    });

    // Atualizar store
    useClienteStore.setState({ clientes });
    useClienteStore.getState().atualizarStatusTodos();

    console.log("Clientes carregados do Firebase");
    return clientes;
  } catch (error) {
    // Verificar se é erro de quota excedida
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Usando dados do LocalStorage.");
      // Retornar dados do LocalStorage em vez de lançar erro
      return useClienteStore.getState().clientes;
    }
    console.error("Erro ao carregar clientes do Firebase:", error);
    // Retornar dados locais em caso de erro
    return useClienteStore.getState().clientes;
  } finally {
    isSyncing = false;
  }
};

/**
 * Busca todos os servidores do Firestore e atualiza o LocalStorage
 */
export const syncServidoresFromFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização.");
    return [];
  }

  if (isSyncing || quotaExceeded) return [];

  try {
    isSyncing = true;
    const q = query(
      collection(db, SERVIDORES_COLLECTION),
      where("userId", "==", USER_ID)
    );
    const querySnapshot = await getDocs(q);

    const servidores = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Remover userId e updatedAt antes de salvar
      const { userId, updatedAt, ...servidor } = data;
      servidores.push(servidor);
    });

    // Atualizar store
    useServidorStore.setState({ servidores });

    console.log("Servidores carregados do Firebase");
    return servidores;
  } catch (error) {
    // Verificar se é erro de quota excedida
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Usando dados do LocalStorage.");
      // Retornar dados do LocalStorage em vez de lançar erro
      return useServidorStore.getState().servidores;
    }
    console.error("Erro ao carregar servidores do Firebase:", error);
    // Retornar dados locais em caso de erro
    return useServidorStore.getState().servidores;
  } finally {
    isSyncing = false;
  }
};

/**
 * Adiciona um cliente no Firestore
 */
export const addClienteToFirebase = async (cliente) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, `${USER_ID}_${cliente.id}`);
    await setDoc(clienteRef, {
      ...cliente,
      userId: USER_ID,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados salvos apenas localmente.");
    } else {
    console.error("Erro ao adicionar cliente no Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Atualiza um cliente no Firestore
 */
export const updateClienteInFirebase = async (cliente) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, `${USER_ID}_${cliente.id}`);
    await setDoc(
      clienteRef,
      {
        ...cliente,
        userId: USER_ID,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados salvos apenas localmente.");
    } else {
    console.error("Erro ao atualizar cliente no Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Remove um cliente do Firestore
 */
export const deleteClienteFromFirebase = async (clienteId) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, `${USER_ID}_${clienteId}`);
    await deleteDoc(clienteRef);
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados deletados apenas localmente.");
    } else {
    console.error("Erro ao deletar cliente do Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Adiciona um servidor no Firestore
 */
export const addServidorToFirebase = async (servidor) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const servidorRef = doc(
      db,
      SERVIDORES_COLLECTION,
      `${USER_ID}_${servidor.id}`
    );
    await setDoc(servidorRef, {
      ...servidor,
      userId: USER_ID,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados salvos apenas localmente.");
    } else {
    console.error("Erro ao adicionar servidor no Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Atualiza um servidor no Firestore
 */
export const updateServidorInFirebase = async (servidor) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const servidorRef = doc(
      db,
      SERVIDORES_COLLECTION,
      `${USER_ID}_${servidor.id}`
    );
    await setDoc(
      servidorRef,
      {
        ...servidor,
        userId: USER_ID,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados salvos apenas localmente.");
    } else {
    console.error("Erro ao atualizar servidor no Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Remove um servidor do Firestore
 */
export const deleteServidorFromFirebase = async (servidorId) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const servidorRef = doc(
      db,
      SERVIDORES_COLLECTION,
      `${USER_ID}_${servidorId}`
    );
    await deleteDoc(servidorRef);
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Dados deletados apenas localmente.");
    } else {
    console.error("Erro ao deletar servidor do Firebase:", error);
    }
    // Não lançar erro para permitir que o sistema continue funcionando
  }
};

/**
 * Sincroniza todos os logs do LocalStorage para o Firestore
 */
export const syncLogsToFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização de logs.");
    return;
  }

  if (isSyncing || quotaExceeded) return;

  try {
    isSyncing = true;
    const logs = useLogStore.getState().logs;
    const logsNaoSincronizados = logs.filter((log) => !log.sincronizado);

    // Sincronizar apenas logs não sincronizados
    const promises = logsNaoSincronizados.map(async (log) => {
      const logRef = doc(db, LOGS_COLLECTION, `${USER_ID}_${log.id}`);
      await setDoc(
        logRef,
        {
          ...log,
          userId: USER_ID,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await Promise.all(promises);
    console.log("Logs sincronizados com Firebase");
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Logs salvos apenas localmente.");
    } else {
      console.error("Erro ao sincronizar logs:", error);
    }
  } finally {
    isSyncing = false;
  }
};

/**
 * Busca todos os logs do Firestore e atualiza o LocalStorage
 */
export const syncLogsFromFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização de logs.");
    return [];
  }

  if (isSyncing || quotaExceeded) return [];

  try {
    isSyncing = true;
    const q = query(
      collection(db, LOGS_COLLECTION),
      where("userId", "==", USER_ID)
    );
    const querySnapshot = await getDocs(q);

    const logs = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const { userId, updatedAt, ...log } = data;
      logs.push(log);
    });

    // Mesclar logs do Firebase com logs locais
    const logsLocais = useLogStore.getState().logs;
    const logsMap = new Map();
    
    // Adicionar logs locais primeiro
    logsLocais.forEach((log) => {
      logsMap.set(log.id, log);
    });
    
    // Adicionar/atualizar com logs do Firebase (Firebase tem prioridade se mais recente)
    logs.forEach((log) => {
      const logLocal = logsMap.get(log.id);
      if (!logLocal || new Date(log.timestamp) > new Date(logLocal.timestamp)) {
        logsMap.set(log.id, { ...log, sincronizado: true });
      }
    });

    // Converter map para array e ordenar por timestamp (mais recente primeiro)
    const logsMesclados = Array.from(logsMap.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Limitar a 1000 logs e filtrar expirados
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 15);
    const logsValidos = logsMesclados
      .filter((log) => new Date(log.timestamp) > dataLimite)
      .slice(0, 1000);

    // Atualizar store
    useLogStore.setState({ logs: logsValidos });

    console.log("Logs carregados do Firebase");
    return logsValidos;
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Usando logs do LocalStorage.");
      return useLogStore.getState().logs;
    }
    console.error("Erro ao carregar logs do Firebase:", error);
    return useLogStore.getState().logs;
  } finally {
    isSyncing = false;
  }
};

/**
 * Adiciona um log no Firestore
 */
export const addLogToFirebase = async (log) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const logRef = doc(db, LOGS_COLLECTION, `${USER_ID}_${log.id}`);
    await setDoc(logRef, {
      ...log,
      userId: USER_ID,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Log salvo apenas localmente.");
    } else {
      console.error("Erro ao adicionar log no Firebase:", error);
    }
  }
};

/**
 * Atualiza um log no Firestore
 */
export const updateLogInFirebase = async (log) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) return;

  try {
    const logRef = doc(db, LOGS_COLLECTION, `${USER_ID}_${log.id}`);
    await setDoc(
      logRef,
      {
        ...log,
        userId: USER_ID,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Log atualizado apenas localmente.");
    } else {
      console.error("Erro ao atualizar log no Firebase:", error);
    }
  }
};

/**
 * Configura listeners em tempo real para sincronização automática
 */
export const setupRealtimeSync = (onSyncStatusChange) => {
  if (!isFirebaseConfigured() || !db || quotaExceeded) {
    console.warn("Firebase não configurado ou quota excedida. Listeners não serão configurados.");
    return () => {}; // Retornar função vazia para unsubscribe
  }

  let isInitialLoad = true;

  // Listener para clientes
  const qClientes = query(
    collection(db, CLIENTES_COLLECTION),
    where("userId", "==", USER_ID)
  );
  const unsubscribeClientes = onSnapshot(
    qClientes,
    async (snapshot) => {
      if (isSyncing) return; // Evitar loop

      // Ignorar primeira carga (já foi feita em initializeSync)
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      // Só sincronizar se não houver writes pendentes (mudanças de outros dispositivos)
      if (
        snapshot.metadata.hasPendingWrites === false &&
        snapshot.docChanges().length > 0
      ) {
        try {
          await syncClientesFromFirebase();
          if (quotaExceeded) {
            onSyncStatusChange?.("offline");
            return;
          }
          onSyncStatusChange?.("synced");
        } catch (error) {
          if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
            quotaExceeded = true;
            onSyncStatusChange?.("offline");
          } else {
          console.error("Erro ao sincronizar clientes:", error);
          onSyncStatusChange?.("error");
          }
        }
      }
    },
    (error) => {
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        quotaExceeded = true;
        console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
        onSyncStatusChange?.("offline");
      } else {
      console.error("Erro no listener de clientes:", error);
      onSyncStatusChange?.("error");
      }
    }
  );

  // Listener para servidores
  const qServidores = query(
    collection(db, SERVIDORES_COLLECTION),
    where("userId", "==", USER_ID)
  );
  const unsubscribeServidores = onSnapshot(
    qServidores,
    async (snapshot) => {
      if (isSyncing) return; // Evitar loop

      // Ignorar primeira carga
      if (isInitialLoad) {
        return;
      }

      // Só sincronizar se não houver writes pendentes
      if (
        snapshot.metadata.hasPendingWrites === false &&
        snapshot.docChanges().length > 0
      ) {
        try {
          await syncServidoresFromFirebase();
          if (quotaExceeded) {
            onSyncStatusChange?.("offline");
            return;
          }
          onSyncStatusChange?.("synced");
        } catch (error) {
          if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
            quotaExceeded = true;
            onSyncStatusChange?.("offline");
          } else {
          console.error("Erro ao sincronizar servidores:", error);
          onSyncStatusChange?.("error");
          }
        }
      }
    },
    (error) => {
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        quotaExceeded = true;
        console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
        onSyncStatusChange?.("offline");
      } else {
      console.error("Erro no listener de servidores:", error);
      onSyncStatusChange?.("error");
      }
    }
  );

  // Listener para logs
  const qLogs = query(
    collection(db, LOGS_COLLECTION),
    where("userId", "==", USER_ID)
  );
  const unsubscribeLogs = onSnapshot(
    qLogs,
    async (snapshot) => {
      if (isSyncing) return;

      if (isInitialLoad) {
        return;
      }

      if (
        snapshot.metadata.hasPendingWrites === false &&
        snapshot.docChanges().length > 0
      ) {
        try {
          await syncLogsFromFirebase();
          if (quotaExceeded) {
            onSyncStatusChange?.("offline");
            return;
          }
          onSyncStatusChange?.("synced");
        } catch (error) {
          if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
            quotaExceeded = true;
            onSyncStatusChange?.("offline");
          } else {
            console.error("Erro ao sincronizar logs:", error);
            onSyncStatusChange?.("error");
          }
        }
      }
    },
    (error) => {
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        quotaExceeded = true;
        console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
        onSyncStatusChange?.("offline");
      } else {
        console.error("Erro no listener de logs:", error);
        onSyncStatusChange?.("error");
      }
    }
  );

  // Retornar função para desinscrever
  return () => {
    unsubscribeClientes();
    unsubscribeServidores();
    unsubscribeLogs();
  };
};

/**
 * Sincronização inicial: carrega do Firebase e configura listeners
 */
export const initializeSync = async (onSyncStatusChange) => {
  if (!isFirebaseConfigured() || !db) {
    console.warn(
      "Firebase não configurado. Sistema funcionará apenas com LocalStorage."
    );
    onSyncStatusChange?.("offline");
    return () => {}; // Retornar função vazia para unsubscribe
  }

  // Se a quota já foi excedida, não tentar sincronizar
  if (quotaExceeded) {
    console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
    onSyncStatusChange?.("offline");
    return () => {};
  }

  try {
    onSyncStatusChange?.("syncing");

    // IMPORTANTE: Primeiro enviar dados locais para o Firebase
    // Isso garante que alterações feitas offline não sejam perdidas
    // Não aguardar erro aqui, apenas tentar
    await Promise.all([
      syncClientesToFirebase(),
      syncServidoresToFirebase(),
      syncLogsToFirebase(),
    ]).catch(() => {
      // Erro já foi tratado nas funções individuais
    });

    // Se a quota foi excedida durante o envio, parar aqui
    if (quotaExceeded) {
      console.warn("Quota excedida durante sincronização. Usando dados locais.");
      onSyncStatusChange?.("offline");
      return () => {};
    }

    // Depois carregar dados do Firebase (para pegar alterações de outros dispositivos)
    // Isso pode sobrescrever dados locais, mas apenas se os dados do Firebase forem mais recentes
    await Promise.all([
      syncClientesFromFirebase(),
      syncServidoresFromFirebase(),
      syncLogsFromFirebase(),
    ]);

    // Se a quota foi excedida durante a leitura, parar aqui
    if (quotaExceeded) {
      console.warn("Quota excedida durante sincronização. Usando dados locais.");
      onSyncStatusChange?.("offline");
      return () => {};
    }

    // Configurar listeners em tempo real (apenas se não houver quota excedida)
    const unsubscribe = setupRealtimeSync(onSyncStatusChange);

    onSyncStatusChange?.("synced");
    return unsubscribe;
  } catch (error) {
    // Verificar se é erro de quota excedida
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
      quotaExceeded = true;
      console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
      onSyncStatusChange?.("offline");
      return () => {};
    }
    console.error("Erro ao inicializar sincronização:", error);
    // Em caso de erro, usar dados locais
    onSyncStatusChange?.("offline");
    return () => {};
  }
};
