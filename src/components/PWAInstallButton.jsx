import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se o app já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      setIsVisible(false);
      return;
    }

    // Listener para o evento de instalação
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Verificar se já foi instalado anteriormente
    if (localStorage.getItem("pwa-installed") === "true") {
      setIsInstalled(true);
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.error("Instalação não disponível no momento");
      return;
    }

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsVisible(false);
        localStorage.setItem("pwa-installed", "true");
        toast.success("App instalado com sucesso!");
      } else {
        toast.info("Instalação cancelada");
      }
    } catch (error) {
      console.error("Erro ao instalar:", error);
      toast.error("Erro ao instalar o app");
    }

    setInstallPrompt(null);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-1.5 h-7 text-xs"
      title="Instalar app na tela inicial"
    >
      <Download className="h-3 w-3" />
      <span className="hidden sm:inline">Instalar</span>
    </Button>
  );
}

