import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Server,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { SyncStatus } from "@/components/SyncStatus";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Clientes",
    icon: Users,
    path: "/clientes",
  },
  {
    title: "Servidores",
    icon: Server,
    path: "/servidores",
  },
  {
    title: "Configurações",
    icon: Settings,
    path: "/configuracoes",
  },
];

function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigation = (path) => {
    navigate(path);
    // Fechar sidebar no mobile após navegação
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <Separator />
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggleButton />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <LogoutButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    // Fechar sidebar no mobile após toggle
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuButton onClick={toggleTheme}>
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span>{theme === "dark" ? "Tema Claro" : "Tema Escuro"}</span>
    </SidebarMenuButton>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
    // Fechar sidebar no mobile antes de navegar
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate("/login");
  };

  return (
    <SidebarMenuButton onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      <span>Sair</span>
    </SidebarMenuButton>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <Sidebar>
        <MenuContent />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 justify-between">
          <SidebarTrigger />
          <SyncStatus />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
