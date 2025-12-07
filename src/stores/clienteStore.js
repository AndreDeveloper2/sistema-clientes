import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { calcularStatus, calcularDiasRestantes } from "@/lib/clienteUtils";
import {
  addClienteToFirebase,
  updateClienteInFirebase,
  deleteClienteFromFirebase,
} from "@/lib/firebaseSync";

export const useClienteStore = create(
  persist(
    (set, get) => ({
      clientes: [],

      // Inicializar com dados de exemplo
      init: () => {
        const clientes = get().clientes;
        if (clientes.length === 0) {
          // Dados iniciais vazios
          set({ clientes: [] });
        }
        // Atualizar status de todos os clientes ao carregar
        get().atualizarStatusTodos();
      },

      // Atualizar status de todos os clientes
      atualizarStatusTodos: () => {
        const clientes = get().clientes;
        const clientesAtualizados = clientes.map((cliente) => {
          const diasRestantes = calcularDiasRestantes(cliente.dataVencimento);
          return {
            ...cliente,
            diasRestantes,
            status: calcularStatus(cliente.dataVencimento, diasRestantes),
          };
        });
        set({ clientes: clientesAtualizados });
      },

      adicionarCliente: async (dadosCliente) => {
        const diasRestantes = calcularDiasRestantes(
          dadosCliente.dataVencimento
        );
        const novoCliente = {
          id: uuidv4(),
          ...dadosCliente,
          diasRestantes,
          status: calcularStatus(dadosCliente.dataVencimento, diasRestantes),
          custoServidor:
            dadosCliente.valorDoServidor * (dadosCliente.telas || 1),
          lucroCliente:
            dadosCliente.valor -
            dadosCliente.valorDoServidor * (dadosCliente.telas || 1),
        };
        set((state) => ({
          clientes: [...state.clientes, novoCliente],
        }));
        get().atualizarStatusTodos();

        // Sincronizar com Firebase (em background, não bloqueia UI)
        addClienteToFirebase(novoCliente).catch((error) => {
          console.error("Erro ao sincronizar cliente com Firebase:", error);
        });

        return novoCliente;
      },

      atualizarCliente: (id, dadosAtualizados) => {
        let clienteAtualizado = null;
        set((state) => ({
          clientes: state.clientes.map((cliente) => {
            if (cliente.id === id) {
              const atualizado = {
                ...cliente,
                ...dadosAtualizados,
              };
              // Recalcular custo e lucro sempre
              const valorDoServidor =
                dadosAtualizados.valorDoServidor !== undefined
                  ? dadosAtualizados.valorDoServidor
                  : cliente.valorDoServidor || 0;
              const telas =
                dadosAtualizados.telas !== undefined
                  ? dadosAtualizados.telas
                  : cliente.telas || 0;
              const valor =
                dadosAtualizados.valor !== undefined
                  ? dadosAtualizados.valor
                  : cliente.valor || 0;

              atualizado.custoServidor = valorDoServidor * (telas || 1);
              atualizado.lucroCliente = valor - atualizado.custoServidor;

              const diasRestantes = calcularDiasRestantes(
                atualizado.dataVencimento
              );
              clienteAtualizado = {
                ...atualizado,
                diasRestantes,
                status: calcularStatus(
                  atualizado.dataVencimento,
                  diasRestantes
                ),
              };
              return clienteAtualizado;
            }
            return cliente;
          }),
        }));
        get().atualizarStatusTodos();

        // Sincronizar com Firebase (em background)
        if (clienteAtualizado) {
          updateClienteInFirebase(clienteAtualizado).catch((error) => {
            console.error("Erro ao sincronizar cliente com Firebase:", error);
          });
        }
      },

      excluirCliente: (id) => {
        set((state) => ({
          clientes: state.clientes.filter((cliente) => cliente.id !== id),
        }));

        // Sincronizar com Firebase (em background)
        deleteClienteFromFirebase(id).catch((error) => {
          console.error("Erro ao deletar cliente do Firebase:", error);
        });
      },

      renovarCliente: (id) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        const novaDataVencimento = new Date(cliente.dataVencimento);
        novaDataVencimento.setDate(novaDataVencimento.getDate() + 30);

        get().atualizarCliente(id, {
          dataVencimento: novaDataVencimento.toISOString().split("T")[0],
          situacao: "PAGO",
        });
      },

      limparTodos: async () => {
        const clientes = get().clientes;

        // Deletar todos do Firebase
        const deletePromises = clientes.map((cliente) =>
          deleteClienteFromFirebase(cliente.id).catch((error) => {
            console.error(
              `Erro ao deletar cliente ${cliente.id} do Firebase:`,
              error
            );
          })
        );

        await Promise.all(deletePromises);

        // Limpar do store
        set({ clientes: [] });
      },
    }),
    {
      name: "clientes-storage",
    }
  )
);
