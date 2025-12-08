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
        // Obter mês atual no formato YYYY-MM
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        
        const clientesAtualizados = clientes.map((cliente) => {
          // Se o cliente está inadimplente, não atualizar status automaticamente
          if (cliente.situacao === "INADIMPLENTE") {
            return cliente;
          }
          
          const diasRestantes = calcularDiasRestantes(cliente.dataVencimento);
          let clienteAtualizado = {
            ...cliente,
            diasRestantes,
            status: calcularStatus(cliente.dataVencimento, diasRestantes),
          };
          
          // Resetar desconto de indicação se o mês mudou
          if (cliente.mesDescontoIndicacao && cliente.mesDescontoIndicacao !== mesAtual) {
            clienteAtualizado = {
              ...clienteAtualizado,
              descontoIndicacao: 0,
              mesDescontoIndicacao: null,
            };
          }
          
          return clienteAtualizado;
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

              // Limpar valorJuros se a situação não for mais INADIMPLENTE
              const situacaoAtualizada = dadosAtualizados.situacao !== undefined
                ? dadosAtualizados.situacao
                : atualizado.situacao;
              
              if (situacaoAtualizada !== "INADIMPLENTE") {
                atualizado.valorJuros = 0;
                atualizado.diasInadimplente = 0;
              }

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

        // Resetar desconto de indicação ao renovar (novo mês)
        get().atualizarCliente(id, {
          dataVencimento: novaDataVencimento.toISOString().split("T")[0],
          situacao: "PAGO",
          descontoIndicacao: 0,
          mesDescontoIndicacao: null,
        });
      },

      aplicarJuros: (id, diasInadimplente) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        // Calcular juros: (valor mensal / 30) * dias de atraso
        // Usar parseFloat e toFixed para garantir precisão
        const valorDiario = parseFloat((cliente.valor / 30).toFixed(4));
        const valorJuros = parseFloat((valorDiario * diasInadimplente).toFixed(2));

        // Atualizar cliente com juros e situação inadimplente
        get().atualizarCliente(id, {
          situacao: "INADIMPLENTE",
          diasInadimplente: diasInadimplente,
          valorJuros: valorJuros,
        });
      },

      aplicarIndicacao: (idIndicador, idIndicado) => {
        const clienteIndicador = get().clientes.find((c) => c.id === idIndicador);
        if (!clienteIndicador) return;

        const descontoIndicacao = 20.0; // R$ 20,00 de desconto por indicação
        const clientesIndicadosAtual = clienteIndicador.clientesIndicados || 0;
        
        // Obter mês atual no formato YYYY-MM
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        
        // Se o desconto foi aplicado em um mês diferente, resetar
        const mesDescontoAnterior = clienteIndicador.mesDescontoIndicacao;
        let descontoTotalAtual = 0;
        
        if (mesDescontoAnterior === mesAtual) {
          // Mesmo mês, acumular desconto
          descontoTotalAtual = clienteIndicador.descontoIndicacao || 0;
        } else {
          // Mês diferente, começar do zero
          descontoTotalAtual = 0;
        }

        // Atualizar cliente que indicou com desconto e incrementar contador
        get().atualizarCliente(idIndicador, {
          clientesIndicados: clientesIndicadosAtual + 1,
          descontoIndicacao: parseFloat((descontoTotalAtual + descontoIndicacao).toFixed(2)),
          mesDescontoIndicacao: mesAtual,
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
