import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username, password) => {
        // Validação de credenciais
        const validUsername = 'tivius'
        const validPassword = '200319Am@@'
        
        if (username === validUsername && password === validPassword) {
          const user = { username, id: Date.now() }
          set({ user, isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

