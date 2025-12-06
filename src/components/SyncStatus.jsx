import { useState, useEffect } from 'react'
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { initializeSync } from '@/lib/firebaseSync'
import { isFirebaseConfigured } from '@/lib/firebase'

export function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState('offline') // 'offline' | 'syncing' | 'synced' | 'error'
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Se Firebase não estiver configurado, mostrar apenas status offline
    if (!isFirebaseConfigured()) {
      setSyncStatus('offline')
      return
    }

    // Verificar status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Inicializar sincronização se estiver online
    if (isOnline) {
      setSyncStatus('syncing')
      initializeSync((status) => {
        setSyncStatus(status)
      })
        .then(() => {
          // Listener já foi configurado dentro de initializeSync
        })
        .catch((error) => {
          console.error('Erro ao inicializar sincronização:', error)
          setSyncStatus('error')
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        text: 'Offline',
        variant: 'secondary',
        className: 'text-muted-foreground',
      }
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: Loader2,
          text: 'Sincronizando...',
          variant: 'secondary',
          className: 'text-blue-600 dark:text-blue-400 animate-spin',
        }
      case 'synced':
        return {
          icon: CheckCircle2,
          text: 'Sincronizado',
          variant: 'secondary',
          className: 'text-green-600 dark:text-green-400',
        }
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Erro',
          variant: 'destructive',
          className: 'text-red-600 dark:text-red-400',
        }
      default:
        return {
          icon: Cloud,
          text: 'Conectando...',
          variant: 'secondary',
          className: 'text-muted-foreground',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">{config.text}</span>
    </Badge>
  )
}

