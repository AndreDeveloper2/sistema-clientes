import { useState, useRef } from 'react'
import { useClienteStore } from '@/stores/clienteStore'
import { useServidorStore } from '@/stores/servidorStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Database, Trash2, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function Configuracoes() {
  const clientes = useClienteStore((state) => state.clientes)
  const servidores = useServidorStore((state) => state.servidores)
  
  const [dialogExcluirClientes, setDialogExcluirClientes] = useState(false)
  const [dialogExcluirServidores, setDialogExcluirServidores] = useState(false)
  const [dialogExcluirTudo, setDialogExcluirTudo] = useState(false)

  const handleLimparClientes = () => {
    localStorage.removeItem('clientes-storage')
    window.location.reload()
    toast.success('Clientes limpos com sucesso!')
  }

  const handleLimparServidores = () => {
    localStorage.removeItem('servidores-storage')
    window.location.reload()
    toast.success('Servidores limpos com sucesso!')
  }

  const handleLimparTudo = () => {
    localStorage.removeItem('clientes-storage')
    localStorage.removeItem('servidores-storage')
    window.location.reload()
    toast.success('Todos os dados foram limpos!')
  }

  const fileInputRef = useRef(null)

  const handleExportarDados = () => {
    const dados = {
      clientes: clientes,
      servidores: servidores,
      dataExportacao: new Date().toISOString(),
      versao: '1.0'
    }

    const jsonString = JSON.stringify(dados, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup-sistema-clientes-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Dados exportados com sucesso!')
  }

  const handleImportarDados = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result)
        
        if (!dados.clientes || !dados.servidores) {
          toast.error('Arquivo inválido. Formato esperado não encontrado.')
          return
        }

        // Validar estrutura básica
        if (!Array.isArray(dados.clientes) || !Array.isArray(dados.servidores)) {
          toast.error('Arquivo inválido. Estrutura de dados incorreta.')
          return
        }

        // Importar dados
        localStorage.setItem('clientes-storage', JSON.stringify({
          state: { clientes: dados.clientes },
          version: 0
        }))
        
        localStorage.setItem('servidores-storage', JSON.stringify({
          state: { servidores: dados.servidores },
          version: 0
        }))

        toast.success('Dados importados com sucesso! Recarregando...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error('Erro ao importar:', error)
        toast.error('Erro ao importar arquivo. Verifique se o arquivo é válido.')
      }
    }
    reader.readAsText(file)
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = ''
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados do Sistema
            </CardTitle>
            <CardDescription>
              Informações sobre os dados armazenados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total de Clientes:
                </span>
                <span className="font-semibold">{clientes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total de Servidores:
                </span>
                <span className="font-semibold">{servidores.length}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Button
                onClick={handleExportarDados}
                className="w-full"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Dados (JSON)
              </Button>
              <Button
                onClick={handleImportarDados}
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Dados (JSON)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis - use com cuidado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="destructive"
                onClick={() => setDialogExcluirClientes(true)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Todos os Clientes
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDialogExcluirServidores(true)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Todos os Servidores
              </Button>
              <Separator />
              <Button
                variant="destructive"
                onClick={() => setDialogExcluirTudo(true)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Todos os Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Sistema de Gestão de Clientes - Versão 1.0
            </p>
            <p>
              Desenvolvido com React + Vite, TailwindCSS e shadcn/ui
            </p>
            <p>
              Todos os dados são armazenados localmente no navegador usando
              LocalStorage.
            </p>
            <p className="mt-2">
              <strong>Importante:</strong> Os dados são salvos no navegador do dispositivo. 
              Para sincronizar entre dispositivos, use a função de Exportar/Importar dados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog Excluir Clientes */}
      <AlertDialog open={dialogExcluirClientes} onOpenChange={setDialogExcluirClientes}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os clientes? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLimparClientes} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar Clientes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Excluir Servidores */}
      <AlertDialog open={dialogExcluirServidores} onOpenChange={setDialogExcluirServidores}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os servidores? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLimparServidores} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar Servidores
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Excluir Tudo */}
      <AlertDialog open={dialogExcluirTudo} onOpenChange={setDialogExcluirTudo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os dados do sistema? Esta ação não pode ser desfeita e todos os clientes e servidores serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLimparTudo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
