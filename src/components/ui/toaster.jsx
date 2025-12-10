import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "border-green-500/50 [&>div>svg]:text-green-600 dark:[&>div>svg]:text-green-400 [&>div>div>div]:text-green-600 dark:[&>div>div>div]:text-green-400",
          error: "border-red-500/50 [&>div>svg]:text-red-600 dark:[&>div>svg]:text-red-400 [&>div>div>div]:text-red-600 dark:[&>div>div>div]:text-red-400",
        },
      }}
    />
  );
}

