import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstaller } from "@/components/PWAInstaller";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Servidores from "@/pages/Servidores";
import Configuracoes from "@/pages/Configuracoes";

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="servidores" element={<Servidores />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
        <Toaster />
        <PWAInstaller />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
