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
import { calcularStatus, calcularDiasRestantes } from "@/lib/clienteUtils";

// IDs das coleções no Firestore
const CLIENTES_COLLECTION = "clientes";
const SERVIDORES_COLLECTION = "servidores";
const USER_ID = "default-user"; // Você pode mudar isso para usar autenticação do Firebase

// Flag para evitar loops de sincronização
let isSyncing = false;

/**
 * Sincroniza todos os clientes do LocalStorage para o Firestore
 */
export const syncClientesToFirebase = async () => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Pulando sincronização.");
    return;
  }

  if (isSyncing) return;

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
    console.error("Erro ao sincronizar clientes:", error);
    throw error;
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

  if (isSyncing) return [];

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
      // Recalcular status e dias restantes
      cliente.diasRestantes = calcularDiasRestantes(cliente.dataVencimento);
      cliente.status = calcularStatus(
        cliente.dataVencimento,
        cliente.diasRestantes
      );
      clientes.push(cliente);
    });

    // Atualizar store
    useClienteStore.setState({ clientes });
    useClienteStore.getState().atualizarStatusTodos();

    console.log("Clientes carregados do Firebase");
    return clientes;
  } catch (error) {
    console.error("Erro ao carregar clientes do Firebase:", error);
    throw error;
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

  if (isSyncing) return [];

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
    console.error("Erro ao carregar servidores do Firebase:", error);
    throw error;
  } finally {
    isSyncing = false;
  }
};

/**
 * Adiciona um cliente no Firestore
 */
export const addClienteToFirebase = async (cliente) => {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, `${USER_ID}_${cliente.id}`);
    await setDoc(clienteRef, {
      ...cliente,
      userId: USER_ID,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao adicionar cliente no Firebase:", error);
    throw error;
  }
};

/**
 * Atualiza um cliente no Firestore
 */
export const updateClienteInFirebase = async (cliente) => {
  if (!isFirebaseConfigured() || !db) return;

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
    console.error("Erro ao atualizar cliente no Firebase:", error);
    throw error;
  }
};

/**
 * Remove um cliente do Firestore
 */
export const deleteClienteFromFirebase = async (clienteId) => {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const clienteRef = doc(db, CLIENTES_COLLECTION, `${USER_ID}_${clienteId}`);
    await deleteDoc(clienteRef);
  } catch (error) {
    console.error("Erro ao deletar cliente do Firebase:", error);
    throw error;
  }
};

/**
 * Adiciona um servidor no Firestore
 */
export const addServidorToFirebase = async (servidor) => {
  if (!isFirebaseConfigured() || !db) return;

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
    console.error("Erro ao adicionar servidor no Firebase:", error);
    throw error;
  }
};

/**
 * Atualiza um servidor no Firestore
 */
export const updateServidorInFirebase = async (servidor) => {
  if (!isFirebaseConfigured() || !db) return;

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
    console.error("Erro ao atualizar servidor no Firebase:", error);
    throw error;
  }
};

/**
 * Remove um servidor do Firestore
 */
export const deleteServidorFromFirebase = async (servidorId) => {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const servidorRef = doc(
      db,
      SERVIDORES_COLLECTION,
      `${USER_ID}_${servidorId}`
    );
    await deleteDoc(servidorRef);
  } catch (error) {
    console.error("Erro ao deletar servidor do Firebase:", error);
    throw error;
  }
};

/**
 * Configura listeners em tempo real para sincronização automática
 */
export const setupRealtimeSync = (onSyncStatusChange) => {
  if (!isFirebaseConfigured() || !db) {
    console.warn("Firebase não configurado. Listeners não serão configurados.");
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
          onSyncStatusChange?.("synced");
        } catch (error) {
          console.error("Erro ao sincronizar clientes:", error);
          onSyncStatusChange?.("error");
        }
      }
    },
    (error) => {
      console.error("Erro no listener de clientes:", error);
      onSyncStatusChange?.("error");
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
          onSyncStatusChange?.("synced");
        } catch (error) {
          console.error("Erro ao sincronizar servidores:", error);
          onSyncStatusChange?.("error");
        }
      }
    },
    (error) => {
      console.error("Erro no listener de servidores:", error);
      onSyncStatusChange?.("error");
    }
  );

  // Retornar função para desinscrever
  return () => {
    unsubscribeClientes();
    unsubscribeServidores();
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

  try {
    onSyncStatusChange?.("syncing");

    // Carregar dados do Firebase
    await Promise.all([
      syncClientesFromFirebase(),
      syncServidoresFromFirebase(),
    ]);

    // Configurar listeners em tempo real
    const unsubscribe = setupRealtimeSync(onSyncStatusChange);

    // Sincronizar dados locais para o Firebase (caso haja dados novos localmente)
    await Promise.all([syncClientesToFirebase(), syncServidoresToFirebase()]);

    onSyncStatusChange?.("synced");
    return unsubscribe;
  } catch (error) {
    console.error("Erro ao inicializar sincronização:", error);
    onSyncStatusChange?.("error");
    throw error;
  }
};
