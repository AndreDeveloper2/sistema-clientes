import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { calcularStatus, calcularDiasRestantes } from '@/lib/clienteUtils'
import { 
  addClienteToFirebase, 
  updateClienteInFirebase, 
  deleteClienteFromFirebase 
} from '@/lib/firebaseSync'

export const useClienteStore = create(
  persist(
    (set, get) => ({
      clientes: [],
      
      // Inicializar com dados de exemplo
      init: () => {
        const clientes = get().clientes
        if (clientes.length === 0) {
          // Dados iniciais vazios
          set({ clientes: [] })
        }
        // Atualizar status de todos os clientes ao carregar
        get().atualizarStatusTodos()
      },

      // Atualizar status de todos os clientes
      atualizarStatusTodos: () => {
        const clientes = get().clientes
        const clientesAtualizados = clientes.map(cliente => ({
          ...cliente,
          status: calcularStatus(cliente.dataVencimento),
          diasRestantes: calcularDiasRestantes(cliente.dataVencimento),
        }))
        set({ clientes: clientesAtualizados })
      },

      adicionarCliente: async (dadosCliente) => {
        const novoCliente = {
          id: uuidv4(),
          ...dadosCliente,
          status: calcularStatus(dadosCliente.dataVencimento),
          diasRestantes: calcularDiasRestantes(dadosCliente.dataVencimento),
          custoServidor: dadosCliente.valorDoServidor + dadosCliente.telas,
          lucroCliente: dadosCliente.valor - (dadosCliente.valorDoServidor + dadosCliente.telas),
        }
        set((state) => ({
          clientes: [...state.clientes, novoCliente],
        }))
        get().atualizarStatusTodos()
        
        // Sincronizar com Firebase (em background, não bloqueia UI)
        addClienteToFirebase(novoCliente).catch((error) => {
          console.error('Erro ao sincronizar cliente com Firebase:', error)
        })
        
        return novoCliente
      },

      atualizarCliente: (id, dadosAtualizados) => {
        let clienteAtualizado = null
        set((state) => ({
          clientes: state.clientes.map((cliente) => {
            if (cliente.id === id) {
              const atualizado = {
                ...cliente,
                ...dadosAtualizados,
              }
              // Recalcular custo e lucro sempre
              const valorDoServidor = dadosAtualizados.valorDoServidor !== undefined 
                ? dadosAtualizados.valorDoServidor 
                : cliente.valorDoServidor || 0
              const telas = dadosAtualizados.telas !== undefined 
                ? dadosAtualizados.telas 
                : cliente.telas || 0
              const valor = dadosAtualizados.valor !== undefined 
                ? dadosAtualizados.valor 
                : cliente.valor || 0
              
              atualizado.custoServidor = valorDoServidor + telas
              atualizado.lucroCliente = valor - atualizado.custoServidor
              
              clienteAtualizado = {
                ...atualizado,
                status: calcularStatus(atualizado.dataVencimento),
                diasRestantes: calcularDiasRestantes(atualizado.dataVencimento),
              }
              return clienteAtualizado
            }
            return cliente
          }),
        }))
        get().atualizarStatusTodos()
        
        // Sincronizar com Firebase (em background)
        if (clienteAtualizado) {
          updateClienteInFirebase(clienteAtualizado).catch((error) => {
            console.error('Erro ao sincronizar cliente com Firebase:', error)
          })
        }
      },

      excluirCliente: (id) => {
        set((state) => ({
          clientes: state.clientes.filter((cliente) => cliente.id !== id),
        }))
        
        // Sincronizar com Firebase (em background)
        deleteClienteFromFirebase(id).catch((error) => {
          console.error('Erro ao deletar cliente do Firebase:', error)
        })
      },

      renovarCliente: (id) => {
        const cliente = get().clientes.find((c) => c.id === id)
        if (!cliente) return

        const novaDataVencimento = new Date(cliente.dataVencimento)
        novaDataVencimento.setDate(novaDataVencimento.getDate() + 30)
        
        get().atualizarCliente(id, {
          dataVencimento: novaDataVencimento.toISOString().split('T')[0],
          situacao: 'PAGO',
        })
      },
    }),
    {
      name: 'clientes-storage',
    }
  )
)

