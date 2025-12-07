import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, RefreshCw, X } from "lucide-react";

export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registrado:", r);
    },
    onRegisterError(error) {
      console.error("Erro ao registrar Service Worker:", error);
    },
    onNeedRefresh() {
      console.log("Nova versão disponível");
    },
    onOfflineReady() {
      console.log("App pronto para uso offline");
    },
  });

  useEffect(() => {
    // Verificar se o app já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listener para o evento de instalação
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallDialog(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowInstallDialog(false);
    }

    setInstallPrompt(null);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleCloseOfflineReady = () => {
    setOfflineReady(false);
  };

  const handleCloseNeedRefresh = () => {
    setNeedRefresh(false);
  };

  return (
    <>
      {/* Dialog de instalação */}
      <Dialog open={showInstallDialog && !isInstalled} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar App</DialogTitle>
            <DialogDescription>
              Adicione o Sistema de Clientes à sua tela inicial para acesso rápido e uso offline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Depois
            </Button>
            <Button onClick={handleInstall}>
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notificação de atualização disponível */}
      {needRefresh && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-background border rounded-lg shadow-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Nova versão disponível!</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCloseNeedRefresh}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Uma nova versão do app está disponível. Atualize para ter acesso às últimas melhorias.
            </p>
            <Button onClick={handleUpdate} size="sm" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Agora
            </Button>
          </div>
        </div>
      )}

      {/* Notificação de app pronto para offline */}
      {offlineReady && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-background border rounded-lg shadow-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">App pronto para uso offline!</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCloseOfflineReady}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O app agora funciona sem conexão com a internet.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

