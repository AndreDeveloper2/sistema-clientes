import { useEffect, useState, useMemo } from "react";
import { useClienteStore } from "@/stores/clienteStore";
import { useServidorStore } from "@/stores/servidorStore";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatarMoeda } from "@/lib/clienteUtils";
import {
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Server,
  Loader2,
} from "lucide-react";

// Hook customizado para animar valores
function useAnimatedValue(targetValue, duration = 1500, isCurrency = false) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) {
      setAnimatedValue(targetValue);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (targetValue - startValue) * easeOut;
      setAnimatedValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(targetValue);
        setHasAnimated(true);
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [targetValue, duration, hasAnimated]);

  if (isCurrency) {
    // Para valores monetários, manter 2 casas decimais sem arredondar para inteiro
    return formatarMoeda(animatedValue);
  }
  return Math.round(animatedValue);
}

export default function Dashboard() {
  const clientes = useClienteStore((state) => state.clientes);
  const servidores = useServidorStore((state) => state.servidores);
  const atualizarStatusTodos = useClienteStore(
    (state) => state.atualizarStatusTodos
  );
  const init = useClienteStore((state) => state.init);
  const { isSynced } = useSyncStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init();
    atualizarStatusTodos();
    // Aguardar um pouco para garantir que os dados foram carregados
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [init, atualizarStatusTodos]);

  // Forçar atualização quando a sincronização terminar ou quando clientes mudarem
  useEffect(() => {
    if (isSynced && isInitialized) {
      atualizarStatusTodos();
    }
  }, [isSynced, isInitialized, atualizarStatusTodos, clientes.length]);

  // Usar useMemo para recalcular apenas quando necessário
  const estatisticas = useMemo(() => {
    // Filtrar apenas clientes não cancelados
    const clientesAtivos = clientes.filter((c) => !c.cancelado);
    
    // Estatísticas gerais
    const totalClientes = clientesAtivos.length;
    const clientesAPagar = clientesAtivos.filter((c) => c.situacao === "PENDENTE").length;
    const clientesPagos = clientesAtivos.filter((c) => c.situacao === "PAGO").length;
    const clientesInadimplentes = clientesAtivos.filter(
      (c) => c.situacao === "INADIMPLENTE"
    ).length;
    const clientesVencidos = clientesAtivos.filter(
      (c) => c.status === "VENCIDO"
    ).length;

    // Valor já recebido (clientes pagos)
    const valorJaRecebido = clientesAtivos
      .filter((c) => c.situacao === "PAGO")
      .reduce((acc, c) => acc + (c.valor || 0), 0);

    const valorPendente = clientesAtivos
      .filter((c) => c.situacao === "PENDENTE")
      .reduce((acc, c) => acc + (c.valor || 0), 0);

    const valorJuros = clientesAtivos
      .filter((c) => c.situacao === "INADIMPLENTE")
      .reduce((acc, c) => acc + (c.valorJuros || 0), 0);

    // Faturamento Total (soma de todos os valores, independente da situação)
    const faturamentoTotal = clientesAtivos.reduce((acc, c) => acc + (c.valor || 0), 0);

    // Lucro Total (soma do lucro de cada cliente)
    const lucroTotal = clientesAtivos.reduce(
      (acc, c) => acc + (c.lucroCliente || 0),
      0
    );

    return {
      totalClientes,
      clientesAPagar,
      clientesPagos,
      clientesInadimplentes,
      clientesVencidos,
      valorJaRecebido,
      valorPendente,
      valorJuros,
      faturamentoTotal,
      lucroTotal,
    };
  }, [clientes, isSynced]); // Recalcular quando clientes mudarem ou sincronização terminar

  const {
    totalClientes,
    clientesAPagar,
    clientesPagos,
    clientesInadimplentes,
    clientesVencidos,
    valorJaRecebido,
    valorPendente,
    valorJuros,
    faturamentoTotal,
    lucroTotal,
  } = estatisticas;

  // Estatísticas por servidor
  const estatisticasPorServidor = useMemo(() => {
    return servidores.map((servidor) => {
      const clientesDoServidor = clientes.filter(
        (c) => c.servidor === servidor.nome && !c.cancelado
      );
      const totalClientesServidor = clientesDoServidor.length;
      const custoTotalServidor = servidor.custoBase * totalClientesServidor;
      const valorRecebidoServidor = clientesDoServidor
        .filter((c) => c.situacao === "PAGO")
        .reduce((acc, c) => acc + (c.valor || 0), 0);

      return {
        nome: servidor.nome,
        totalClientes: totalClientesServidor,
        custoTotal: custoTotalServidor,
        valorRecebido: valorRecebidoServidor,
      };
    });
  }, [servidores, clientes, isSynced]);

  // Valores animados
  const animatedTotalClientes = useAnimatedValue(totalClientes);
  const animatedClientesAPagar = useAnimatedValue(clientesAPagar);
  const animatedClientesPagos = useAnimatedValue(clientesPagos);
  const animatedClientesInadimplentes = useAnimatedValue(clientesInadimplentes);
  const animatedClientesVencidos = useAnimatedValue(clientesVencidos);
  const animatedValorJaRecebido = useAnimatedValue(valorJaRecebido, 1500, true);
  const animatedValorPendente = useAnimatedValue(valorPendente, 1500, true);
  const animatedValorJuros = useAnimatedValue(valorJuros, 1500, true);
  const animatedFaturamentoTotal = useAnimatedValue(
    faturamentoTotal,
    1500,
    true
  );
  const animatedLucroTotal = useAnimatedValue(lucroTotal, 1500, true);

  const statCards = [
    {
      title: "Total de Clientes",
      value: animatedTotalClientes,
      icon: Users,
      iconColor: "blue",
      description: "Clientes cadastrados",
    },
    {
      title: "Pendentes",
      value: animatedClientesAPagar,
      icon: AlertCircle,
      iconColor: "yellow",
      description: "Clientes com pagamento pendente",
    },
    {
      title: "Pagos",
      value: animatedClientesPagos,
      icon: CheckCircle,
      iconColor: "green",
      description: "Clientes pagos",
    },
    {
      title: "Inadimplentes",
      value: animatedClientesInadimplentes,
      icon: AlertCircle,
      iconColor: "orange",
      description: "Clientes inadimplentes",
    },
    {
      title: "Vencidos",
      value: animatedClientesVencidos,
      icon: AlertCircle,
      iconColor: "red",
      description: "Clientes com pagamento vencido",
    },
    {
      title: "Valor de Juros",
      value: animatedValorJuros,
      icon: DollarSign,
      iconColor: "orange",
      description: "Total de juros por inadimplência",
    },
    {
      title: "Valor Pendente",
      value: animatedValorPendente,
      icon: DollarSign,
      iconColor: "yellow",
      description: "Valor a receber",
    },
    {
      title: "Valor já recebido",
      value: animatedValorJaRecebido,
      icon: DollarSign,
      iconColor: "green",
      description: "Total já pago este mês",
    },
    {
      title: "Faturamento Total",
      value: animatedFaturamentoTotal,
      icon: DollarSign,
      iconColor: "blue",
      description: "Total bruto de todos os clientes",
    },
    {
      title: "Lucro Total",
      value: animatedLucroTotal,
      icon: TrendingUp,
      iconColor: "green",
      description: "Lucro líquido total",
    },
  ];

  // Mostrar loading enquanto sincroniza (apenas se Firebase estiver configurado)
  const showLoading = !isSynced && isInitialized;

  return (
    <div className="flex-1 space-y-3 p-3 md:p-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
        </div>
        {showLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Sincronizando...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const iconColorClasses = {
            blue: "bg-blue-950/70 dark:bg-blue-950/80",
            green: "bg-green-950/70 dark:bg-green-950/80",
            red: "bg-red-950/70 dark:bg-red-950/80",
            yellow: "bg-yellow-950/70 dark:bg-yellow-950/80",
            orange: "bg-orange-950/70 dark:bg-orange-950/80",
          };
          const iconTextClasses = {
            blue: "text-blue-400 dark:text-blue-300",
            green: "text-green-400 dark:text-green-300",
            red: "text-red-400 dark:text-red-300",
            yellow: "text-yellow-400 dark:text-yellow-300",
            orange: "text-orange-400 dark:text-orange-300",
          };
          // Faturamento Total e Lucro Total ocupam toda a largura
          const isFullWidthCard =
            stat.title === "Faturamento Total" || stat.title === "Lucro Total";
          return (
            <Card
              key={stat.title}
              className={`dashboard-card rounded-lg border-0 ${
                isFullWidthCard ? "col-span-2 md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <CardContent
                className={`p-3 md:p-6 ${isFullWidthCard ? "text-center" : ""}`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isFullWidthCard
                      ? "flex-col items-center justify-center"
                      : ""
                  }`}
                >
                  <div
                    className={`rounded-full p-2.5 flex-shrink-0 ${
                      iconColorClasses[stat.iconColor]
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 md:h-6 md:w-6 stroke-[2.5] ${
                        iconTextClasses[stat.iconColor]
                      }`}
                    />
                  </div>
                  <div
                    className={`flex-1 min-w-0 ${
                      isFullWidthCard ? "text-center" : ""
                    }`}
                  >
                    <CardTitle
                      className={`text-xs md:text-sm font-medium ${
                        isFullWidthCard ? "" : "truncate"
                      } mb-1`}
                    >
                      {stat.title}
                    </CardTitle>
                    <div className="text-lg md:text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas por Servidor */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Estatísticas por Servidor</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {estatisticasPorServidor.map((stat) => (
            <Card
              key={stat.nome}
              className="dashboard-card rounded-lg border-0"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {stat.nome}
                </CardTitle>
                <CardDescription>Estatísticas do servidor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total de Clientes:
                  </span>
                  <span className="font-semibold">{stat.totalClientes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Custo Total:
                  </span>
                  <span className="font-semibold">
                    {formatarMoeda(stat.custoTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valor Recebido:
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatarMoeda(stat.valorRecebido)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {estatisticasPorServidor.length === 0 && (
          <Card className="dashboard-card rounded-lg border-0">
            <CardContent className="py-6 text-center text-muted-foreground">
              Nenhum servidor cadastrado
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
