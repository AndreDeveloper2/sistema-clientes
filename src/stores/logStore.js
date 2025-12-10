import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

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
        return novoLog;
      },

      // Marcar log como sincronizado
      marcarComoSincronizado: (logId) => {
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === logId ? { ...log, sincronizado: true } : log
          ),
        }));
      },

      // Marcar log de exclusão como recuperado
      marcarComoRecuperado: (logId) => {
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === logId ? { ...log, recuperado: true } : log
          ),
        }));
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
