import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { useClienteStore } from './clienteStore'
import { 
  addServidorToFirebase, 
  updateServidorInFirebase, 
  deleteServidorFromFirebase 
} from '@/lib/firebaseSync'

export const useServidorStore = create(
  persist(
    (set, get) => ({
      servidores: [],
      
      adicionarServidor: (dadosServidor) => {
        const novoServidor = {
          id: uuidv4(),
          ...dadosServidor,
        }
        set((state) => ({
          servidores: [...state.servidores, novoServidor],
        }))
        
        // Sincronizar com Firebase (em background)
        addServidorToFirebase(novoServidor).catch((error) => {
          console.error('Erro ao sincronizar servidor com Firebase:', error)
        })
        
        return novoServidor
      },

      atualizarServidor: (id, dadosAtualizados) => {
        let servidorAtualizado = null
        set((state) => ({
          servidores: state.servidores.map((servidor) => {
            if (servidor.id === id) {
              servidorAtualizado = { ...servidor, ...dadosAtualizados }
              return servidorAtualizado
            }
            return servidor
          }),
        }))
        
        // Sincronizar com Firebase (em background)
        if (servidorAtualizado) {
          updateServidorInFirebase(servidorAtualizado).catch((error) => {
            console.error('Erro ao sincronizar servidor com Firebase:', error)
          })
        }
      },

      excluirServidor: (id) => {
        set((state) => ({
          servidores: state.servidores.filter((servidor) => servidor.id !== id),
        }))
        
        // Sincronizar com Firebase (em background)
        deleteServidorFromFirebase(id).catch((error) => {
          console.error('Erro ao deletar servidor do Firebase:', error)
        })
      },

      getServidorById: (id) => {
        return get().servidores.find((s) => s.id === id)
      },

      // Estatísticas do servidor
      getEstatisticasServidor: (servidorId) => {
        const clientes = useClienteStore.getState().clientes
        const servidor = get().getServidorById(servidorId)
        
        if (!servidor) return null

        const clientesDoServidor = clientes.filter(
          (c) => c.servidor === servidor.nome
        )

        const totalClientes = clientesDoServidor.length
        const custoTotal = servidor.custoBase * totalClientes
        
        const valorRecebido = clientesDoServidor
          .filter((c) => c.situacao === 'PAGO')
          .reduce((acc, c) => acc + c.valor, 0)
        
        const lucroTotal = clientesDoServidor.reduce(
          (acc, c) => acc + c.lucroCliente,
          0
        )

        return {
          servidor,
          totalClientes,
          custoTotal,
          valorRecebido,
          lucroTotal,
        }
      },
    }),
    {
      name: 'servidores-storage',
    }
  )
)

