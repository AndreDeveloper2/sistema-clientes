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
export const syncClientesFromFirebase = async (preserveLocal = false) => {
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

    const clientesFirebase = [];
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
      clientesFirebase.push(cliente);
    });

    // Fazer merge inteligente
    const clientesLocais = useClienteStore.getState().clientes;
    const clientesMap = new Map();
    
    // Se não houver clientes locais, usar apenas dados do Firebase
    if (clientesLocais.length === 0) {
      const clientes = clientesFirebase;
      useClienteStore.setState({ clientes });
      useClienteStore.getState().atualizarStatusTodos();
      console.log("Clientes carregados do Firebase");
      return clientes;
    }
    
    // Se preserveLocal = true, priorizar dados locais (quando envio para Firebase falhou)
    if (preserveLocal) {
      // Primeiro, adicionar todos os clientes locais (preservar edições locais)
      clientesLocais.forEach((cliente) => {
        clientesMap.set(cliente.id, cliente);
      });
      
      // Depois, adicionar apenas clientes do Firebase que não existem localmente
      clientesFirebase.forEach((cliente) => {
        if (!clientesMap.has(cliente.id)) {
          clientesMap.set(cliente.id, cliente);
        }
      });
    } else {
      // Se preserveLocal = false, usar dados do Firebase (que já incluem nossas edições locais)
      // pois enviamos dados locais para Firebase antes de carregar
      clientesFirebase.forEach((cliente) => {
        clientesMap.set(cliente.id, cliente);
      });
      
      // Adicionar clientes locais que não estão no Firebase (backup de segurança)
      clientesLocais.forEach((cliente) => {
        if (!clientesMap.has(cliente.id)) {
          clientesMap.set(cliente.id, cliente);
        }
      });
    }

    // Converter map de volta para array
    const clientes = Array.from(clientesMap.values());

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
      // hasPendingWrites = false significa que as mudanças já foram commitadas no servidor
      if (
        snapshot.metadata.hasPendingWrites === false &&
        snapshot.docChanges().length > 0
      ) {
        try {
          // Aplicar mudanças do Firebase (vindas de outros dispositivos)
          const clientesLocais = useClienteStore.getState().clientes;
          const clientesMap = new Map();
          
          // Primeiro, adicionar todos os clientes locais
          clientesLocais.forEach((cliente) => {
            clientesMap.set(cliente.id, cliente);
          });
          
          // Depois, aplicar mudanças do Firebase (sobrescrever com dados mais recentes)
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const { userId, updatedAt, ...cliente } = data;
              
              // Recalcular status e dias restantes apenas se não for inadimplente
              if (cliente.situacao !== "INADIMPLENTE") {
                cliente.diasRestantes = calcularDiasRestantes(cliente.dataVencimento);
                cliente.status = calcularStatus(
                  cliente.dataVencimento,
                  cliente.diasRestantes
                );
              }
              
              // Aplicar mudança do Firebase (sobrescrever dados locais)
              // Isso garante que renovações e edições de outros dispositivos sejam aplicadas
              clientesMap.set(cliente.id, cliente);
            } else if (change.type === 'removed') {
              // Remover cliente se foi deletado no Firebase
              clientesMap.delete(change.doc.id.replace(`${USER_ID}_`, ''));
            }
          });
          
          const clientes = Array.from(clientesMap.values());
          useClienteStore.setState({ clientes });
          useClienteStore.getState().atualizarStatusTodos();
          
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
      // Ignorar erros de bloqueio por extensões do navegador (adblockers)
      if (error.code === 'cancelled' || error.message?.includes('blocked') || error.message?.includes('ERR_BLOCKED')) {
        console.warn("Conexão com Firebase bloqueada por extensão do navegador. Sistema funcionará offline.");
        onSyncStatusChange?.("offline");
        return;
      }
      
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        quotaExceeded = true;
        console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
        onSyncStatusChange?.("offline");
      } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        console.warn("Firebase temporariamente indisponível. Sistema funcionará offline.");
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
      // Ignorar erros de bloqueio por extensões do navegador (adblockers)
      if (error.code === 'cancelled' || error.message?.includes('blocked') || error.message?.includes('ERR_BLOCKED')) {
        console.warn("Conexão com Firebase bloqueada por extensão do navegador. Sistema funcionará offline.");
        onSyncStatusChange?.("offline");
        return;
      }
      
      if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
        quotaExceeded = true;
        console.warn("Quota do Firebase excedida. Sistema funcionará apenas com LocalStorage.");
        onSyncStatusChange?.("offline");
      } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        console.warn("Firebase temporariamente indisponível. Sistema funcionará offline.");
        onSyncStatusChange?.("offline");
      } else {
        console.error("Erro no listener de servidores:", error);
        onSyncStatusChange?.("error");
      }
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
    let syncSuccess = false;
    try {
      await Promise.all([
        syncClientesToFirebase(),
        syncServidoresToFirebase(),
      ]);
      syncSuccess = true;
      console.log("Dados locais enviados para Firebase com sucesso");
    } catch (error) {
      // Erro já foi tratado nas funções individuais
      console.warn("Falha ao enviar dados locais para Firebase, mantendo dados locais");
      syncSuccess = false;
    }

    // Se a quota foi excedida durante o envio, parar aqui
    if (quotaExceeded) {
      console.warn("Quota excedida durante sincronização. Usando dados locais.");
      onSyncStatusChange?.("offline");
      return () => {};
    }

    // Depois carregar dados do Firebase (para pegar alterações de outros dispositivos)
    // Se o envio foi bem-sucedido, usar dados do Firebase (que já incluem nossas edições)
    // Se o envio falhou, priorizar dados locais para não perder edições
    if (syncSuccess) {
      // Envio bem-sucedido: usar dados do Firebase (que já incluem nossas edições locais)
      // Isso permite que mudanças de outros dispositivos sejam aplicadas também
      await Promise.all([
        syncClientesFromFirebase(false), // false = usar dados do Firebase
        syncServidoresFromFirebase(),
      ]);
    } else {
      // Envio falhou: fazer merge preservando dados locais
      console.log("Fazendo merge preservando dados locais devido a falha no envio");
      await Promise.all([
        syncClientesFromFirebase(true), // true = preservar dados locais
        syncServidoresFromFirebase(),
      ]).catch(() => {
        // Se também falhar ao carregar, manter dados locais
      });
    }

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
