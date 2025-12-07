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
    const body = document.body

    // Remover todas as classes de tema
    root.classList.remove("light", "dark", "system")

    // Sempre usar o tema escolhido pelo usuário, ignorar preferência do sistema
    let currentTheme = theme === "system" ? "light" : theme

    // Adicionar classe do tema
    root.classList.add(currentTheme)
    
    // Forçar color-scheme via JavaScript com !important para sobrescrever qualquer preferência do sistema
    if (currentTheme === "dark") {
      root.style.setProperty("color-scheme", "dark", "important")
      body.style.setProperty("color-scheme", "dark", "important")
    } else {
      root.style.setProperty("color-scheme", "light", "important")
      body.style.setProperty("color-scheme", "light", "important")
    }
    
    // Forçar meta tag theme-color para mobile (evita que o navegador use preferência do sistema)
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    // Cores mais específicas para mobile
    metaThemeColor.setAttribute('content', currentTheme === "dark" ? "#0a0a0a" : "#ffffff")
    
    // Adicionar meta tag para Apple (iOS)
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (!appleMeta) {
      appleMeta = document.createElement('meta')
      appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
      document.head.appendChild(appleMeta)
    }
    appleMeta.setAttribute('content', currentTheme === "dark" ? "black" : "default")
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

