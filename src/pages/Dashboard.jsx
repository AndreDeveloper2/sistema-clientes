import { useEffect } from 'react'
import { useClienteStore } from '@/stores/clienteStore'
import { useServidorStore } from '@/stores/servidorStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatarMoeda } from '@/lib/clienteUtils'
import {
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Server,
} from 'lucide-react'

export default function Dashboard() {
  const clientes = useClienteStore((state) => state.clientes)
  const servidores = useServidorStore((state) => state.servidores)
  const atualizarStatusTodos = useClienteStore((state) => state.atualizarStatusTodos)
  const init = useClienteStore((state) => state.init)

  useEffect(() => {
    init()
    atualizarStatusTodos()
  }, [init, atualizarStatusTodos])

  // Estatísticas gerais
  const totalClientes = clientes.length
  const clientesAPagar = clientes.filter((c) => c.status === 'A PAGAR').length
  const clientesPagos = clientes.filter((c) => c.situacao === 'PAGO').length
  const clientesVencidos = clientes.filter((c) => c.status === 'VENCIDO').length

  const faturamentoTotal = clientes
    .filter((c) => c.situacao === 'PAGO')
    .reduce((acc, c) => acc + c.valor, 0)

  const valorPendente = clientes
    .filter((c) => c.situacao === 'PENDENTE')
    .reduce((acc, c) => acc + c.valor, 0)

  const lucroTotal = clientes.reduce((acc, c) => acc + (c.lucroCliente || 0), 0)

  // Estatísticas por servidor
  const estatisticasPorServidor = servidores.map((servidor) => {
    const clientesDoServidor = clientes.filter((c) => c.servidor === servidor.nome)
    const totalClientesServidor = clientesDoServidor.length
    const custoTotalServidor = servidor.custoBase * totalClientesServidor
    const valorRecebidoServidor = clientesDoServidor
      .filter((c) => c.situacao === 'PAGO')
      .reduce((acc, c) => acc + c.valor, 0)

    return {
      nome: servidor.nome,
      totalClientes: totalClientesServidor,
      custoTotal: custoTotalServidor,
      valorRecebido: valorRecebidoServidor,
    }
  })

  const statCards = [
    {
      title: 'Total de Clientes',
      value: totalClientes,
      icon: Users,
      description: 'Clientes cadastrados',
    },
    {
      title: 'A Pagar',
      value: clientesAPagar,
      icon: AlertCircle,
      description: 'Clientes com pagamento pendente',
      className: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Pagos',
      value: clientesPagos,
      icon: CheckCircle,
      description: 'Clientes pagos',
      className: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Vencidos',
      value: clientesVencidos,
      icon: AlertCircle,
      description: 'Clientes com pagamento vencido',
      className: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Faturamento Total',
      value: formatarMoeda(faturamentoTotal),
      icon: DollarSign,
      description: 'Valor total recebido',
      className: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Valor Pendente',
      value: formatarMoeda(valorPendente),
      icon: DollarSign,
      description: 'Valor a receber',
      className: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Lucro Total',
      value: formatarMoeda(lucroTotal),
      icon: TrendingUp,
      description: 'Lucro líquido',
      className: 'text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão de clientes
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.className || 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.className || ''}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Estatísticas por Servidor */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Estatísticas por Servidor</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {estatisticasPorServidor.map((stat) => (
            <Card key={stat.nome}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {stat.nome}
                </CardTitle>
                <CardDescription>Estatísticas do servidor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de Clientes:</span>
                  <span className="font-semibold">{stat.totalClientes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Custo Total:</span>
                  <span className="font-semibold">{formatarMoeda(stat.custoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Recebido:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatarMoeda(stat.valorRecebido)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {estatisticasPorServidor.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Nenhum servidor cadastrado
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

