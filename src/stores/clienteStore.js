import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { calcularStatus, calcularDiasRestantes } from "@/lib/clienteUtils";
import {
  addClienteToFirebase,
  updateClienteInFirebase,
  deleteClienteFromFirebase,
} from "@/lib/firebaseSync";
import { useLogStore } from "@/stores/logStore";

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
        const mesAtual = `${hoje.getFullYear()}-${String(
          hoje.getMonth() + 1
        ).padStart(2, "0")}`;

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
          if (
            cliente.mesDescontoIndicacao &&
            cliente.mesDescontoIndicacao !== mesAtual
          ) {
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
          cancelado: false,
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

        // Adicionar log de criação
        const logCriacao = useLogStore.getState().adicionarLog({
          tipo: "CRIACAO",
          entidade: "CLIENTE",
          entidadeId: novoCliente.id,
          descricao: `Cliente "${novoCliente.nome}" foi criado`,
          dados: {
            cliente: novoCliente,
            detalhes: {
              nome: novoCliente.nome,
              valor: novoCliente.valor,
              servidor: novoCliente.servidor,
              telas: novoCliente.telas,
              situacao: novoCliente.situacao,
              dataVencimento: novoCliente.dataVencimento,
            },
          },
        });

        // Sincronizar com Firebase (em background, não bloqueia UI)
        addClienteToFirebase(novoCliente)
          .then(() => {
            // Marcar log como sincronizado após sucesso
            useLogStore.getState().marcarComoSincronizado(logCriacao.id);
          })
          .catch((error) => {
            console.error("Erro ao sincronizar cliente com Firebase:", error);
          });

        return novoCliente;
      },

      atualizarCliente: (id, dadosAtualizados, criarLog = true) => {
        let clienteAtualizado = null;
        let clienteAnterior = null;

        set((state) => ({
          clientes: state.clientes.map((cliente) => {
            if (cliente.id === id) {
              clienteAnterior = { ...cliente };
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
              const situacaoAtualizada =
                dadosAtualizados.situacao !== undefined
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

        // Adicionar log de edição com detalhes das mudanças (apenas se criarLog for true)
        if (criarLog && clienteAtualizado && clienteAnterior) {
          const mudancas = [];
          Object.keys(dadosAtualizados).forEach((key) => {
            const valorAnterior = clienteAnterior[key];
            const valorNovo = clienteAtualizado[key];
            if (valorAnterior !== valorNovo) {
              mudancas.push({
                campo: key,
                valorAnterior: valorAnterior,
                valorNovo: valorNovo,
              });
            }
          });

          const logEdicao = useLogStore.getState().adicionarLog({
            tipo: "EDICAO",
            entidade: "CLIENTE",
            entidadeId: id,
            descricao: `Cliente "${clienteAtualizado.nome}" foi editado`,
            dados: {
              clienteAnterior: clienteAnterior,
              clienteAtualizado: clienteAtualizado,
              mudancas: mudancas,
              detalhes: mudancas
                .map((m) => `${m.campo}: ${m.valorAnterior} → ${m.valorNovo}`)
                .join(", "),
            },
          });

          // Sincronizar com Firebase (em background)
          updateClienteInFirebase(clienteAtualizado)
            .then(() => {
              // Marcar log como sincronizado após sucesso
              useLogStore.getState().marcarComoSincronizado(logEdicao.id);
            })
            .catch((error) => {
              console.error("Erro ao sincronizar cliente com Firebase:", error);
            });
        } else if (clienteAtualizado) {
          // Ainda sincronizar com Firebase mesmo sem criar log
          updateClienteInFirebase(clienteAtualizado)
            .then(() => {
              // Não há log para marcar como sincronizado
            })
            .catch((error) => {
              console.error("Erro ao sincronizar cliente com Firebase:", error);
            });
        }
      },

      excluirCliente: (id) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        set((state) => ({
          clientes: state.clientes.filter((cliente) => cliente.id !== id),
        }));

        // Adicionar log de exclusão com dados do cliente para recuperação
        const logExclusao = useLogStore.getState().adicionarLog({
          tipo: "EXCLUSAO",
          entidade: "CLIENTE",
          entidadeId: id,
          descricao: `Cliente "${cliente.nome}" foi excluído`,
          dados: {
            cliente: cliente,
            dadosCliente: cliente, // Dados completos para recuperação
            detalhes: {
              nome: cliente.nome,
              valor: cliente.valor,
              servidor: cliente.servidor,
              situacao: cliente.situacao,
            },
          },
        });

        // Sincronizar com Firebase (em background)
        deleteClienteFromFirebase(id)
          .then(() => {
            // Marcar log como sincronizado após sucesso
            useLogStore.getState().marcarComoSincronizado(logExclusao.id);
          })
          .catch((error) => {
            console.error("Erro ao deletar cliente do Firebase:", error);
          });
      },

      renovarCliente: (id) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        const dataVencimentoAnterior = cliente.dataVencimento;
        const novaDataVencimento = new Date(cliente.dataVencimento);
        novaDataVencimento.setDate(novaDataVencimento.getDate() + 30);
        const novaDataVencimentoStr = novaDataVencimento
          .toISOString()
          .split("T")[0];

        // Resetar desconto de indicação ao renovar (novo mês)
        get().atualizarCliente(id, {
          dataVencimento: novaDataVencimentoStr,
          situacao: "PAGO",
          descontoIndicacao: 0,
          mesDescontoIndicacao: null,
        });

        // Adicionar log de renovação
        const logRenovacao = useLogStore.getState().adicionarLog({
          tipo: "RENOVACAO",
          entidade: "CLIENTE",
          entidadeId: id,
          descricao: `Cliente "${cliente.nome}" foi renovado`,
          dados: {
            cliente: cliente,
            detalhes: {
              nome: cliente.nome,
              dataVencimentoAnterior: dataVencimentoAnterior,
              novaDataVencimento: novaDataVencimentoStr,
              situacaoAnterior: cliente.situacao,
              novaSituacao: "PAGO",
            },
          },
        });

        // Marcar log como sincronizado (renovação já atualiza o cliente que já tem log de edição)
        // O log de edição será marcado como sincronizado quando a atualização for concluída
      },

      aplicarJuros: (id, diasInadimplente) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        // Calcular juros: (valor mensal / 30) * dias de atraso
        // Usar parseFloat e toFixed para garantir precisão
        const valorDiario = parseFloat((cliente.valor / 30).toFixed(4));
        const valorJuros = parseFloat(
          (valorDiario * diasInadimplente).toFixed(2)
        );

        // Atualizar cliente com juros e situação inadimplente (sem criar log de edição)
        get().atualizarCliente(
          id,
          {
            situacao: "INADIMPLENTE",
            diasInadimplente: diasInadimplente,
            valorJuros: valorJuros,
          },
          false
        );

        // Adicionar log específico de aplicação de juros
        const logJuros = useLogStore.getState().adicionarLog({
          tipo: "APLICACAO_JUROS",
          entidade: "CLIENTE",
          entidadeId: id,
          descricao: `Juros aplicados ao cliente "${cliente.nome}"`,
          dados: {
            cliente: cliente,
            detalhes: {
              nome: cliente.nome,
              diasInadimplente: diasInadimplente,
              valorJuros: valorJuros,
              valorMensalidade: cliente.valor,
              valorTotal: parseFloat((cliente.valor + valorJuros).toFixed(2)),
            },
          },
        });

        // Sincronizar com Firebase (em background)
        const clienteAtualizado = get().clientes.find((c) => c.id === id);
        if (clienteAtualizado) {
          updateClienteInFirebase(clienteAtualizado)
            .then(() => {
              useLogStore.getState().marcarComoSincronizado(logJuros.id);
            })
            .catch((error) => {
              console.error("Erro ao sincronizar cliente com Firebase:", error);
            });
        }
      },

      aplicarIndicacao: (idIndicador, idIndicado) => {
        const clienteIndicador = get().clientes.find(
          (c) => c.id === idIndicador
        );
        const clienteIndicado = get().clientes.find((c) => c.id === idIndicado);
        if (!clienteIndicador) return;

        const descontoIndicacao = 20.0; // R$ 20,00 de desconto por indicação
        const clientesIndicadosAtual = clienteIndicador.clientesIndicados || 0;

        // Obter mês atual no formato YYYY-MM
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(
          hoje.getMonth() + 1
        ).padStart(2, "0")}`;

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

        const descontoTotalNovo = parseFloat(
          (descontoTotalAtual + descontoIndicacao).toFixed(2)
        );

        // Atualizar cliente que indicou com desconto e incrementar contador (sem criar log de edição)
        get().atualizarCliente(
          idIndicador,
          {
            clientesIndicados: clientesIndicadosAtual + 1,
            descontoIndicacao: descontoTotalNovo,
            mesDescontoIndicacao: mesAtual,
          },
          false
        );

        // Adicionar log específico de registro de indicação
        const logIndicacao = useLogStore.getState().adicionarLog({
          tipo: "REGISTRO_INDICACAO",
          entidade: "CLIENTE",
          entidadeId: idIndicador,
          descricao: `Indicação registrada: ${
            clienteIndicado?.nome || "Cliente"
          } foi indicado por "${clienteIndicador.nome}"`,
          dados: {
            clienteIndicador: clienteIndicador,
            clienteIndicado: clienteIndicado,
            detalhes: {
              nomeIndicador: clienteIndicador.nome,
              nomeIndicado: clienteIndicado?.nome || "Cliente novo",
              descontoAplicado: descontoIndicacao,
              descontoTotal: descontoTotalNovo,
              clientesIndicadosTotal: clientesIndicadosAtual + 1,
            },
          },
        });

        // Sincronizar com Firebase (em background)
        const clienteAtualizado = get().clientes.find(
          (c) => c.id === idIndicador
        );
        if (clienteAtualizado) {
          updateClienteInFirebase(clienteAtualizado)
            .then(() => {
              useLogStore.getState().marcarComoSincronizado(logIndicacao.id);
            })
            .catch((error) => {
              console.error("Erro ao sincronizar cliente com Firebase:", error);
            });
        }
      },

      marcarComoCancelado: (id, cancelado = true) => {
        const cliente = get().clientes.find((c) => c.id === id);
        if (!cliente) return;

        // Atualizar cliente sem criar log de edição
        get().atualizarCliente(
          id,
          {
            cancelado: cancelado,
          },
          false
        );

        // Adicionar log específico de cancelamento/restauração
        const logCancelamento = useLogStore.getState().adicionarLog({
          tipo: "CANCELAMENTO",
          entidade: "CLIENTE",
          entidadeId: id,
          descricao: cancelado
            ? `Cliente "${cliente.nome}" foi marcado como cancelado`
            : `Cliente "${cliente.nome}" foi reativado`,
          dados: {
            cliente: cliente,
            detalhes: {
              nome: cliente.nome,
              cancelado: cancelado,
              acao: cancelado ? "CANCELADO" : "REATIVADO",
            },
          },
        });

        // Sincronizar com Firebase (em background)
        const clienteAtualizado = get().clientes.find((c) => c.id === id);
        if (clienteAtualizado) {
          updateClienteInFirebase(clienteAtualizado)
            .then(() => {
              useLogStore.getState().marcarComoSincronizado(logCancelamento.id);
            })
            .catch((error) => {
              console.error("Erro ao sincronizar cliente com Firebase:", error);
            });
        }
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
