import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "vite-ui-theme" }) {
  const [theme, setTheme] = useState(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(storageKey) || defaultTheme
      }
      return defaultTheme
    }
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    let currentTheme = theme

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      currentTheme = systemTheme
    }

    root.classList.add(currentTheme)
    
    // Força a atualização do tema
    if (currentTheme === "dark") {
      root.style.colorScheme = "dark"
    } else {
      root.style.colorScheme = "light"
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
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

