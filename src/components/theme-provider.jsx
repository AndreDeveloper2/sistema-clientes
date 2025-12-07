import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "vite-ui-theme" }) {
  const [theme, setTheme] = useState(
    () => {
      if (typeof window !== "undefined") {
        const savedTheme = localStorage.getItem(storageKey)
        // Se o tema salvo for "system", converter para "light" para evitar problemas
        if (savedTheme === "system") {
          localStorage.setItem(storageKey, "light")
          return "light"
        }
        return savedTheme || defaultTheme
      }
      return defaultTheme
    }
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    // Sempre usar o tema escolhido pelo usuário, ignorar preferência do sistema
    let currentTheme = theme === "system" ? "light" : theme

    root.classList.add(currentTheme)
    
    // Força a atualização do tema e ignora preferência do sistema
    // Usar !important via style para sobrescrever qualquer preferência do sistema
    if (currentTheme === "dark") {
      root.style.colorScheme = "dark"
      root.style.setProperty("color-scheme", "dark", "important")
    } else {
      root.style.colorScheme = "light"
      root.style.setProperty("color-scheme", "light", "important")
    }
    
    // Forçar meta tag para evitar que o navegador use a preferência do sistema
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', currentTheme === "dark" ? "#0a0a0a" : "#ffffff")
    
    // Forçar também no body para garantir
    document.body.style.colorScheme = currentTheme
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      // Garantir que sempre salve "light" ou "dark", nunca "system"
      const themeToSave = newTheme === "system" ? "light" : newTheme
      localStorage.setItem(storageKey, themeToSave)
      setTheme(themeToSave)
    },
  }

  return (
    <ThemeProviderContext.Provider {...{ value }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

