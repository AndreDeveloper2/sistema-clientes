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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { PWAInstallButton } from "@/components/PWAInstallButton";

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

function HeaderThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-7 w-7"
      title={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function HeaderAvatar() {
  const { theme } = useTheme();
  const avatarSrc = theme === "dark" ? "/AvatarD.png" : "/Avatar.png";

  return (
    <div className="flex items-center gap-3">
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarSrc} alt="Tivius" />
          <AvatarFallback>TI</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">Tivius</span>
          <Badge variant="secondary" className="mt-1 w-fit text-[10px] h-4 px-1.5">
            Administrador
          </Badge>
        </div>
      </div>
    </div>
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
          <div className="flex items-center gap-2">
            <SyncStatus />
            <PWAInstallButton />
            <HeaderThemeToggle />
            <HeaderAvatar />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
