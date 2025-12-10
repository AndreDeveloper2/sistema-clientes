import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { addLogToFirebase } from "@/lib/firebaseSync";

export const useLogStore = create(
  persist(
    (set, get) => ({
      logs: [],

      // Adicionar um novo log
      adicionarLog: (log) => {
        // Limpar logs expirados antes de adicionar novo
        const state = get();
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 15);
        const logsValidos = state.logs.filter(
          (l) => new Date(l.timestamp) > dataLimite
        );

        const novoLog = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          sincronizado: false,
          ...log,
        };
        set({
          logs: [novoLog, ...logsValidos].slice(0, 1000), // Limitar a 1000 logs
        });

        // Sincronizar com Firebase (em background, não bloqueia UI)
        addLogToFirebase(novoLog)
          .then(() => {
            // Marcar log como sincronizado após sucesso
            get().marcarComoSincronizado(novoLog.id);
          })
          .catch((error) => {
            console.error("Erro ao sincronizar log com Firebase:", error);
          });

        return novoLog;
      },

      // Marcar log como sincronizado
      marcarComoSincronizado: (logId) => {
        const log = get().logs.find((l) => l.id === logId);
        if (log) {
          const logAtualizado = { ...log, sincronizado: true };
          set((state) => ({
            logs: state.logs.map((l) =>
              l.id === logId ? logAtualizado : l
            ),
          }));
          // Atualizar no Firebase também
          import("@/lib/firebaseSync").then(({ updateLogInFirebase }) => {
            updateLogInFirebase(logAtualizado).catch((error) => {
              console.error("Erro ao atualizar log no Firebase:", error);
            });
          });
        }
      },

      // Marcar log de exclusão como recuperado
      marcarComoRecuperado: (logId) => {
        const log = get().logs.find((l) => l.id === logId);
        if (log) {
          const logAtualizado = { ...log, recuperado: true };
          set((state) => ({
            logs: state.logs.map((l) =>
              l.id === logId ? logAtualizado : l
            ),
          }));
          // Atualizar no Firebase também
          import("@/lib/firebaseSync").then(({ updateLogInFirebase }) => {
            updateLogInFirebase(logAtualizado).catch((error) => {
              console.error("Erro ao atualizar log no Firebase:", error);
            });
          });
        }
      },

      // Recuperar cliente excluído
      recuperarCliente: (logId) => {
        const log = get().logs.find((l) => l.id === logId);
        if (log && log.tipo === "EXCLUSAO" && log.dados?.dadosCliente) {
          return log.dados.dadosCliente;
        }
        return null;
      },

      // Limpar logs antigos (manter apenas os últimos N dias)
      limparLogsAntigos: (dias = 15) => {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);

        set((state) => ({
          logs: state.logs.filter(
            (log) => new Date(log.timestamp) > dataLimite
          ),
        }));
      },

      // Limpar logs expirados automaticamente (15 dias)
      limparLogsExpirados: () => {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 15);

        set((state) => ({
          logs: state.logs.filter(
            (log) => new Date(log.timestamp) > dataLimite
          ),
        }));
      },

      // Limpar todos os logs
      limparTodos: () => {
        set({ logs: [] });
      },
    }),
    {
      name: "logs-storage",
    }
  )
);
