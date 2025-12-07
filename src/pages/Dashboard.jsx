import { useEffect, useState } from "react";
import { useClienteStore } from "@/stores/clienteStore";
import { useServidorStore } from "@/stores/servidorStore";
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
    return formatarMoeda(Math.round(animatedValue));
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

  useEffect(() => {
    init();
    atualizarStatusTodos();
  }, [init, atualizarStatusTodos]);

  // Estatísticas gerais
  const totalClientes = clientes.length;
  const clientesAPagar = clientes.filter((c) => c.status === "A PAGAR").length;
  const clientesPagos = clientes.filter((c) => c.situacao === "PAGO").length;
  const clientesVencidos = clientes.filter(
    (c) => c.status === "VENCIDO"
  ).length;

  const faturamentoTotal = clientes
    .filter((c) => c.situacao === "PAGO")
    .reduce((acc, c) => acc + c.valor, 0);

  const valorPendente = clientes
    .filter((c) => c.situacao === "PENDENTE")
    .reduce((acc, c) => acc + c.valor, 0);

  const lucroTotal = clientes.reduce(
    (acc, c) => acc + (c.lucroCliente || 0),
    0
  );

  // Estatísticas por servidor
  const estatisticasPorServidor = servidores.map((servidor) => {
    const clientesDoServidor = clientes.filter(
      (c) => c.servidor === servidor.nome
    );
    const totalClientesServidor = clientesDoServidor.length;
    const custoTotalServidor = servidor.custoBase * totalClientesServidor;
    const valorRecebidoServidor = clientesDoServidor
      .filter((c) => c.situacao === "PAGO")
      .reduce((acc, c) => acc + c.valor, 0);

    return {
      nome: servidor.nome,
      totalClientes: totalClientesServidor,
      custoTotal: custoTotalServidor,
      valorRecebido: valorRecebidoServidor,
    };
  });

  // Valores animados
  const animatedTotalClientes = useAnimatedValue(totalClientes);
  const animatedClientesAPagar = useAnimatedValue(clientesAPagar);
  const animatedClientesPagos = useAnimatedValue(clientesPagos);
  const animatedClientesVencidos = useAnimatedValue(clientesVencidos);
  const animatedFaturamentoTotal = useAnimatedValue(
    faturamentoTotal,
    1500,
    true
  );
  const animatedValorPendente = useAnimatedValue(valorPendente, 1500, true);
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
      title: "A Pagar",
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
      title: "Vencidos",
      value: animatedClientesVencidos,
      icon: AlertCircle,
      iconColor: "red",
      description: "Clientes com pagamento vencido",
    },
    {
      title: "Faturamento Total",
      value: animatedFaturamentoTotal,
      icon: DollarSign,
      iconColor: "green",
      description: "Valor total recebido",
    },
    {
      title: "Valor Pendente",
      value: animatedValorPendente,
      icon: DollarSign,
      iconColor: "yellow",
      description: "Valor a receber",
    },
    {
      title: "Lucro Total",
      value: animatedLucroTotal,
      icon: TrendingUp,
      iconColor: "blue",
      description: "Lucro líquido",
    },
  ];

  return (
    <div className="flex-1 space-y-3 p-3 md:p-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const iconColorClasses = {
            blue: "bg-blue-950/70 dark:bg-blue-950/80",
            green: "bg-green-950/70 dark:bg-green-950/80",
            red: "bg-red-950/70 dark:bg-red-950/80",
            yellow: "bg-yellow-950/70 dark:bg-yellow-950/80",
          };
          const iconTextClasses = {
            blue: "text-blue-400 dark:text-blue-300",
            green: "text-green-400 dark:text-green-300",
            red: "text-red-400 dark:text-red-300",
            yellow: "text-yellow-400 dark:text-yellow-300",
          };
          const isLastCard = index === statCards.length - 1;
          return (
            <Card
              key={stat.title}
              className={`dashboard-card rounded-lg border-0 ${
                isLastCard ? "col-span-2 md:col-span-1 lg:col-span-1" : ""
              }`}
            >
              <CardContent
                className={`p-3 md:p-6 ${isLastCard ? "text-center" : ""}`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isLastCard ? "flex-col items-center justify-center" : ""
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
                      isLastCard ? "text-center" : ""
                    }`}
                  >
                    <CardTitle
                      className={`text-xs md:text-sm font-medium ${
                        isLastCard ? "" : "truncate"
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
