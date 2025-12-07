import { useState, useEffect, useRef } from "react";
import { useClienteStore } from "@/stores/clienteStore";
import { useServidorStore } from "@/stores/servidorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Zap,
  Search,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  X,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatarData, formatarMoeda } from "@/lib/clienteUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Clientes() {
  const clientes = useClienteStore((state) => state.clientes);
  const servidores = useServidorStore((state) => state.servidores);
  const adicionarCliente = useClienteStore((state) => state.adicionarCliente);
  const atualizarCliente = useClienteStore((state) => state.atualizarCliente);
  const excluirCliente = useClienteStore((state) => state.excluirCliente);
  const renovarCliente = useClienteStore((state) => state.renovarCliente);
  const atualizarStatusTodos = useClienteStore(
    (state) => state.atualizarStatusTodos
  );
  const init = useClienteStore((state) => state.init);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroServidor, setFiltroServidor] = useState("TODOS");
  const [ordenacaoVencimento, setOrdenacaoVencimento] = useState(null); // null, 'asc', 'desc'
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogVisualizar, setDialogVisualizar] = useState(false);
  const [dialogExcluir, setDialogExcluir] = useState(false);
  const [dialogRenovar, setDialogRenovar] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);

  // Contar quantos filtros estão ativos
  const filtrosAtivos =
    (filtroStatus !== "TODOS" ? 1 : 0) +
    (filtroServidor !== "TODOS" ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroStatus("TODOS");
    setFiltroServidor("TODOS");
  };

  const [formData, setFormData] = useState({
    nome: "",
    dataEntrada: "",
    dataVencimento: "",
    valor: "",
    situacao: "PENDENTE",
    servidor: "",
    telas: "",
    valorDoServidor: "",
  });

  useEffect(() => {
    init();
    atualizarStatusTodos();
  }, [init, atualizarStatusTodos]);

  const clientesFiltrados = clientes
    .filter((cliente) => {
      const matchSearch = cliente.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Filtro de status baseado nos dias restantes
      let matchStatus = true;
      if (filtroStatus !== "TODOS") {
        if (filtroStatus === "VENCIDO") {
          matchStatus =
            cliente.diasRestantes < 0 || cliente.status === "VENCIDO";
        } else if (filtroStatus === "A VENCER") {
          matchStatus =
            cliente.diasRestantes >= 0 && cliente.diasRestantes <= 5;
        } else if (filtroStatus === "EM DIA") {
          matchStatus = cliente.diasRestantes > 5;
        }
      }

      const matchServidor =
        filtroServidor === "TODOS" || cliente.servidor === filtroServidor;
      return matchSearch && matchStatus && matchServidor;
    })
    .sort((a, b) => {
      if (ordenacaoVencimento === null) return 0;

      const dataA = new Date(a.dataVencimento).getTime();
      const dataB = new Date(b.dataVencimento).getTime();

      if (ordenacaoVencimento === "asc") {
        // Mais longe para vencer primeiro (datas mais longe primeiro)
        return dataB - dataA;
      } else if (ordenacaoVencimento === "desc") {
        // Mais próximos para vencer primeiro (datas mais próximas primeiro)
        return dataA - dataB;
      }
      return 0;
    });

  // Paginação
  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);

  // Ajustar página atual se necessário
  const paginaAjustada =
    totalPaginas > 0 ? Math.min(paginaAtual, totalPaginas) : 1;

  const indiceInicio = (paginaAjustada - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indiceInicio, indiceFim);

  // Resetar para primeira página quando filtros mudarem
  const prevFiltersRef = useRef({ searchTerm, filtroStatus, filtroServidor });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.searchTerm !== searchTerm ||
      prevFilters.filtroStatus !== filtroStatus ||
      prevFilters.filtroServidor !== filtroServidor;

    if (filtersChanged) {
      prevFiltersRef.current = { searchTerm, filtroStatus, filtroServidor };
      // Usar setTimeout para evitar warning do linter
      setTimeout(() => {
        setPaginaAtual(1);
      }, 0);
    }
  }, [searchTerm, filtroStatus, filtroServidor]);

  const handleOrdenarVencimento = (direcao) => {
    if (ordenacaoVencimento === direcao) {
      setOrdenacaoVencimento(null); // Remove ordenação se clicar no mesmo
    } else {
      setOrdenacaoVencimento(direcao);
    }
  };

  // Função auxiliar para obter classes de cor baseadas nos dias restantes
  const getCorPorDiasRestantes = (diasRestantes) => {
    if (diasRestantes === 0) {
      // Vence hoje: roxo
      return "text-purple-600 dark:text-purple-400";
    }
    if (diasRestantes > 7) {
      // Mais de 7 dias: verde
      return "text-green-600 dark:text-green-400";
    } else if (diasRestantes >= 1 && diasRestantes <= 7) {
      // 1 a 7 dias: azul
      return "text-blue-600 dark:text-blue-400";
    } else {
      // Vencido (negativo): vermelho
      return "text-red-600 dark:text-red-400";
    }
  };

  const getStatusBadge = (status, diasRestantes) => {
    // Usar a mesma lógica de cores do badge de data de vencimento
    if (diasRestantes === 0) {
      // Vence hoje: roxo
      return (
        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
          VENCE HOJE
        </Badge>
      );
    }

    if (diasRestantes < 0) {
      // Vencido: vermelho
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
          VENCIDO
        </Badge>
      );
    }

    if (diasRestantes >= 1 && diasRestantes <= 7) {
      // 1 a 7 dias: azul
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
          A VENCER
        </Badge>
      );
    }

    // Mais de 7 dias: verde
    return (
      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
        EM DIA
      </Badge>
    );
  };

  const getSituacaoBadge = (situacao) => {
    if (situacao === "PAGO") {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
          PAGO
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
        PENDENTE
      </Badge>
    );
  };

  const getDataVencimentoBadge = (dataVencimento, diasRestantes) => {
    const dataFormatada = formatarData(dataVencimento);

    if (diasRestantes === 0) {
      // Vence hoje: roxo
      return (
        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
          {dataFormatada}
        </Badge>
      );
    }

    if (diasRestantes > 7) {
      // Mais de 7 dias: verde
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
          {dataFormatada}
        </Badge>
      );
    } else if (diasRestantes >= 1 && diasRestantes <= 7) {
      // 1 a 7 dias: azul
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
          {dataFormatada}
        </Badge>
      );
    } else {
      // Vencido (negativo): vermelho
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
          {dataFormatada}
        </Badge>
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const servidorSelecionado = servidores.find(
      (s) => s.nome === formData.servidor
    );
    const custoBaseServidor = servidorSelecionado?.custoBase || 0;

    const dados = {
      ...formData,
      valor: parseFloat(formData.valor),
      telas: parseInt(formData.telas) || 0,
      valorDoServidor:
        parseFloat(formData.valorDoServidor) || custoBaseServidor,
    };

    if (modoEdicao && clienteSelecionado) {
      atualizarCliente(clienteSelecionado.id, dados);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      adicionarCliente(dados);
      toast.success("Cliente adicionado com sucesso!");
    }

    resetForm();
    setDialogAberto(false);
  };

  const handleEditar = (cliente) => {
    setClienteSelecionado(cliente);
    setModoEdicao(true);
    setFormData({
      nome: cliente.nome,
      dataEntrada: cliente.dataEntrada,
      dataVencimento: cliente.dataVencimento,
      valor: cliente.valor.toString(),
      situacao: cliente.situacao,
      servidor: cliente.servidor,
      telas: cliente.telas?.toString() || "",
      valorDoServidor: cliente.valorDoServidor?.toString() || "",
    });
    setDialogAberto(true);
  };

  const handleExcluirClick = (cliente) => {
    setClienteSelecionado(cliente);
    setDialogExcluir(true);
  };

  const confirmarExcluir = () => {
    if (clienteSelecionado) {
      excluirCliente(clienteSelecionado.id);
      toast.success("Cliente excluído com sucesso!");
      setDialogExcluir(false);
      setClienteSelecionado(null);
    }
  };

  const handleRenovarClick = (cliente) => {
    setClienteSelecionado(cliente);
    setDialogRenovar(true);
  };

  const confirmarRenovar = () => {
    if (clienteSelecionado) {
      renovarCliente(clienteSelecionado.id);
      toast.success(`Cliente ${clienteSelecionado.nome} renovado com sucesso!`);
      setDialogRenovar(false);
      setClienteSelecionado(null);
    }
  };

  const handleVisualizar = (cliente) => {
    setClienteSelecionado(cliente);
    setDialogVisualizar(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      dataEntrada: "",
      dataVencimento: "",
      valor: "",
      situacao: "PENDENTE",
      servidor: "",
      telas: "",
      valorDoServidor: "",
    });
    setClienteSelecionado(null);
    setModoEdicao(false);
  };

  const abrirDialogNovo = () => {
    resetForm();
    setDialogAberto(true);
  };

  return (
    <div className="flex-1 space-y-2 p-2 md:p-4 pt-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight">
            Clientes
          </h2>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button
              onClick={abrirDialogNovo}
              size="sm"
              className="text-xs md:text-sm rounded-full px-4"
            >
              <UserPlus className="mr-0.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao
                  ? "Atualize as informações do cliente"
                  : "Preencha os dados do novo cliente"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servidor">Servidor *</Label>
                  <Select
                    value={formData.servidor}
                    onValueChange={(value) => {
                      const servidorSelecionado = servidores.find(
                        (s) => s.nome === value
                      );
                      setFormData({
                        ...formData,
                        servidor: value,
                        valorDoServidor:
                          servidorSelecionado?.custoBase?.toString() ||
                          formData.valorDoServidor,
                      });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o servidor" />
                    </SelectTrigger>
                    <SelectContent>
                      {servidores.map((servidor) => (
                        <SelectItem key={servidor.id} value={servidor.nome}>
                          {servidor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataEntrada">Data de Entrada *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-empty={!formData.dataEntrada}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataEntrada ? (
                          (() => {
                            // Criar data no timezone local para evitar problemas
                            const [ano, mes, dia] = formData.dataEntrada
                              .split("-")
                              .map(Number);
                            const date = new Date(ano, mes - 1, dia);
                            return format(date, "PPP", { locale: ptBR });
                          })()
                        ) : (
                          <span className="text-muted-foreground">
                            Selecione a data
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.dataEntrada
                            ? (() => {
                                // Criar data no timezone local para evitar problemas
                                const [ano, mes, dia] = formData.dataEntrada
                                  .split("-")
                                  .map(Number);
                                return new Date(ano, mes - 1, dia);
                              })()
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            // Criar data no timezone local para evitar problemas
                            // O date já vem do Calendar no timezone local, mas vamos garantir
                            const localDate = new Date(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate()
                            );
                            const ano = localDate.getFullYear();
                            const mes = String(
                              localDate.getMonth() + 1
                            ).padStart(2, "0");
                            const dia = String(localDate.getDate()).padStart(
                              2,
                              "0"
                            );
                            const dateStr = `${ano}-${mes}-${dia}`;
                            setFormData({ ...formData, dataEntrada: dateStr });
                          }
                        }}
                        captionLayout="dropdown"
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-empty={!formData.dataVencimento}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataVencimento ? (
                          (() => {
                            // Criar data no timezone local para evitar problemas
                            const [ano, mes, dia] = formData.dataVencimento
                              .split("-")
                              .map(Number);
                            const date = new Date(ano, mes - 1, dia);
                            return format(date, "PPP", { locale: ptBR });
                          })()
                        ) : (
                          <span className="text-muted-foreground">
                            Selecione a data
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.dataVencimento
                            ? (() => {
                                // Criar data no timezone local para evitar problemas
                                const [ano, mes, dia] = formData.dataVencimento
                                  .split("-")
                                  .map(Number);
                                return new Date(ano, mes - 1, dia);
                              })()
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            // Criar data no timezone local para evitar problemas
                            // O date já vem do Calendar no timezone local, mas vamos garantir
                            const localDate = new Date(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate()
                            );
                            const ano = localDate.getFullYear();
                            const mes = String(
                              localDate.getMonth() + 1
                            ).padStart(2, "0");
                            const dia = String(localDate.getDate()).padStart(
                              2,
                              "0"
                            );
                            const dateStr = `${ano}-${mes}-${dia}`;
                            setFormData({
                              ...formData,
                              dataVencimento: dateStr,
                            });
                          }
                        }}
                        captionLayout="dropdown"
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="situacao">Situação *</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={(value) =>
                      setFormData({ ...formData, situacao: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGO">PAGO</SelectItem>
                      <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telas">Quantidade de Telas</Label>
                  <Input
                    id="telas"
                    type="number"
                    value={formData.telas}
                    onChange={(e) =>
                      setFormData({ ...formData, telas: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorDoServidor">
                    Valor do Servidor (R$)
                  </Label>
                  <Input
                    id="valorDoServidor"
                    type="number"
                    step="0.01"
                    value={formData.valorDoServidor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorDoServidor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogAberto(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {modoEdicao ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="A VENCER">A Vencer</SelectItem>
                  <SelectItem value="EM DIA">Em Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Servidor</Label>
              <Select value={filtroServidor} onValueChange={setFiltroServidor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {servidores.map((servidor) => (
                    <SelectItem key={servidor.id} value={servidor.nome}>
                      {servidor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versão Mobile - Cards */}
      <div className="block md:hidden">
        {/* Container com background que envolve tudo */}
        <div className="bg-card rounded-lg border p-4 space-y-3">
          {/* Cabeçalho da tabela mobile - Busca, Filtros e Ordenação */}
          <div className="space-y-2">
            {/* Busca e Botão de Filtros */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="buscar-mobile" className="text-xs mb-1 block">
                  Buscar usuário
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="buscar-mobile"
                    placeholder="Usuário"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block opacity-0">&nbsp;</Label>
                <Button
                  variant={filtrosExpandidos ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
                  className="h-8 px-2 relative"
                >
                  <Filter className="h-4 w-4" />
                  {filtrosAtivos > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] font-semibold">
                      {filtrosAtivos}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtros expandidos */}
            {filtrosExpandidos && (
              <div className="pt-2 space-y-3 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de usuário</Label>
                  <Select
                    value={filtroServidor}
                    onValueChange={setFiltroServidor}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {servidores.map((servidor) => (
                        <SelectItem key={servidor.id} value={servidor.nome}>
                          {servidor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                      <SelectItem value="A VENCER">A Vencer</SelectItem>
                      <SelectItem value="EM DIA">Em Dia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vencimento</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                      <SelectItem value="A VENCER">A Vencer</SelectItem>
                      <SelectItem value="EM DIA">Em Dia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filtrosAtivos > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limparFiltros}
                    className="text-red-600 dark:text-red-400 text-xs h-7 w-full justify-start"
                  >
                    <X className="mr-1.5 h-3 w-3" />
                    Remover filtros
                  </Button>
                )}
              </div>
            )}

            {/* Botão de ordenação Expira em */}
            <div className="pt-2 border-t">
              <Button
                size="sm"
                onClick={() => {
                  if (ordenacaoVencimento === null) {
                    setOrdenacaoVencimento("desc");
                  } else if (ordenacaoVencimento === "desc") {
                    setOrdenacaoVencimento("asc");
                  } else {
                    setOrdenacaoVencimento(null);
                  }
                }}
                variant={
                  ordenacaoVencimento === "desc" ||
                  ordenacaoVencimento === "asc"
                    ? "default"
                    : "outline"
                }
                className="h-8 text-xs px-3 items-center"
              >
                Expira em
                {ordenacaoVencimento === "desc" ? (
                  <ChevronUp className="ml-0.5 h-3 w-3" />
                ) : ordenacaoVencimento === "asc" ? (
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                ) : (
                  <ChevronDown className="ml-0.5 h-3 w-3 opacity-50" />
                )}
              </Button>
            </div>
          </div>

          {/* Lista de Cards */}
          <div className="space-y-3">
            {clientesPaginados.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            ) : (
              clientesPaginados.map((cliente, index) => {
                // Calcular mensagem de expiração
                const diasRestantes = cliente.diasRestantes;
                const mensagemExpira =
                  diasRestantes < 0
                    ? `Vencido há ${Math.abs(diasRestantes)} ${
                        Math.abs(diasRestantes) === 1 ? "dia" : "dias"
                      }`
                    : diasRestantes === 0
                    ? "Expira hoje"
                    : `Expira em ${diasRestantes} ${
                        diasRestantes === 1 ? "dia" : "dias"
                      }`;

                // Cores alternadas para cards (par/ímpar)
                const isPar = index % 2 === 0;

                return (
                  <Card
                    key={cliente.id}
                    className={`text-sm p-3 client-card-${
                      isPar ? "odd" : "even"
                    } ${isPar ? "border" : ""}`}
                  >
                    <div className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold truncate">
                            {cliente.nome}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {cliente.servidor}
                          </p>
                        </div>
                        <div className="flex-shrink-0 pt-0.5">
                          {getStatusBadge(
                            cliente.status,
                            cliente.diasRestantes
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-0">
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-start text-xs">
                          <span className="text-muted-foreground">
                            Vencimento:
                          </span>
                          <div className="flex flex-col items-end gap-0.5">
                            {getDataVencimentoBadge(
                              cliente.dataVencimento,
                              cliente.diasRestantes
                            )}
                            <span className="text-xs text-muted-foreground">
                              {mensagemExpira}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold">
                          {formatarMoeda(cliente.valor)}
                        </span>
                      </div>

                      <div className="border-t pt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Ações:
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVisualizar(cliente)}
                            className="h-7 w-7"
                            title="Visualizar"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(cliente)}
                            className="h-7 w-7 text-green-600 dark:text-green-400"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRenovarClick(cliente)}
                            className="h-7 w-7 text-yellow-600 dark:text-yellow-400"
                            title="Renovar"
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluirClick(cliente)}
                            className="h-7 w-7 text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Paginação Mobile */}
          {clientesFiltrados.length > 0 && (
            <div className="mt-3 space-y-2 px-1">
              {/* Botões de paginação - direita acima */}
              <div className="flex items-center justify-end gap-0.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setPaginaAtual((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paginaAjustada === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (pagina) => {
                    // Mostrar apenas algumas páginas ao redor da atual
                    if (
                      pagina === 1 ||
                      pagina === totalPaginas ||
                      (pagina >= paginaAjustada - 1 &&
                        pagina <= paginaAjustada + 1)
                    ) {
                      return (
                        <Button
                          key={pagina}
                          variant={
                            pagina === paginaAjustada ? "default" : "outline"
                          }
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => setPaginaAtual(pagina)}
                        >
                          {pagina}
                        </Button>
                      );
                    } else if (
                      pagina === paginaAjustada - 2 ||
                      pagina === paginaAjustada + 2
                    ) {
                      return (
                        <span
                          key={pagina}
                          className="px-1 text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))
                  }
                  disabled={paginaAjustada === totalPaginas}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Itens por página - alinhado à direita */}
              <div className="flex items-center justify-end gap-1.5">
                <Label
                  htmlFor="itensPorPaginaMobile"
                  className="text-xs text-muted-foreground"
                >
                  Itens por página:
                </Label>
                <Select
                  value={itensPorPagina.toString()}
                  onValueChange={(value) => {
                    setItensPorPagina(parseInt(value));
                    setPaginaAtual(1);
                  }}
                >
                  <SelectTrigger className="w-[60px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Página X a Y - Total de registros - centralizado */}
              <div className="text-xs text-muted-foreground text-center">
                Página {paginaAjustada} a {totalPaginas} - Total de{" "}
                {clientesFiltrados.length} registros
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Versão Desktop - Tabela */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {clientesFiltrados.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md">
            <Table className="table-desktop">
              <TableHeader>
                <TableRow className="rounded-2xl">
                  <TableHead className="pl-6 py-4 rounded-tl-2xl rounded-bl-2xl">
                    Nome
                  </TableHead>
                  <TableHead className="py-4">Servidor</TableHead>
                  <TableHead className="py-4">Data Entrada</TableHead>
                  <TableHead className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span>Vencimento</span>
                      <div className="flex flex-col gap-0">
                        <button
                          onClick={() => handleOrdenarVencimento("desc")}
                          className={`hover:bg-accent/50 rounded transition-colors ${
                            ordenacaoVencimento === "desc" ? "bg-accent/50" : ""
                          }`}
                          title="Ordenar: mais próximos para vencer"
                        >
                          <ChevronUp
                            className={`h-3 w-3 transition-colors ${
                              ordenacaoVencimento === "desc"
                                ? "text-foreground opacity-100"
                                : "text-muted-foreground opacity-60"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleOrdenarVencimento("asc")}
                          className={`hover:bg-accent/50 rounded transition-colors ${
                            ordenacaoVencimento === "asc" ? "bg-accent/50" : ""
                          }`}
                          title="Ordenar: mais longe para vencer"
                        >
                          <ChevronDown
                            className={`h-3 w-3 transition-colors ${
                              ordenacaoVencimento === "asc"
                                ? "text-foreground opacity-100"
                                : "text-muted-foreground opacity-60"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="py-4">Dias Restantes</TableHead>
                  <TableHead className="py-4">Status</TableHead>
                  <TableHead className="py-4">Situação</TableHead>
                  <TableHead className="py-4">Valor</TableHead>
                  <TableHead className="pr-6 w-4 py-4 rounded-tr-2xl rounded-br-2xl">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesPaginados.map((cliente) => {
                    // Função para capitalize (primeira letra maiúscula, resto minúsculo)
                    const capitalizeName = (name) => {
                      if (!name) return "";
                      return (
                        name.charAt(0).toUpperCase() +
                        name.slice(1).toLowerCase()
                      );
                    };

                    return (
                      <TableRow
                        key={cliente.id}
                        className="border-0 rounded-2xl"
                      >
                        <TableCell className="font-medium pl-6 py-4 rounded-l-2xl">
                          {capitalizeName(cliente.nome)}
                        </TableCell>
                        <TableCell>{cliente.servidor}</TableCell>
                        <TableCell>
                          {formatarData(cliente.dataEntrada)}
                        </TableCell>
                        <TableCell>
                          {getDataVencimentoBadge(
                            cliente.dataVencimento,
                            cliente.diasRestantes
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`${getCorPorDiasRestantes(
                              cliente.diasRestantes
                            )} font-medium`}
                          >
                            {cliente.diasRestantes}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            cliente.status,
                            cliente.diasRestantes
                          )}
                        </TableCell>
                        <TableCell>
                          {getSituacaoBadge(cliente.situacao)}
                        </TableCell>
                        <TableCell>{formatarMoeda(cliente.valor)}</TableCell>
                        <TableCell className="pr-6 rounded-r-2xl">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVisualizar(cliente)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditar(cliente)}
                              className="h-8 w-8 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRenovarClick(cliente)}
                              className="h-8 w-8 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExcluirClick(cliente)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {clientesFiltrados.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="itensPorPagina"
                  className="text-sm text-muted-foreground"
                >
                  Itens por página:
                </Label>
                <Select
                  value={itensPorPagina.toString()}
                  onValueChange={(value) => {
                    setItensPorPagina(parseInt(value));
                    setPaginaAtual(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setPaginaAtual((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (pagina) => {
                    // Mostrar apenas algumas páginas ao redor da atual
                    if (
                      pagina === 1 ||
                      pagina === totalPaginas ||
                      (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1)
                    ) {
                      return (
                        <Button
                          key={pagina}
                          variant={
                            pagina === paginaAtual ? "default" : "outline"
                          }
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPaginaAtual(pagina)}
                        >
                          {pagina}
                        </Button>
                      );
                    } else if (
                      pagina === paginaAtual - 2 ||
                      pagina === paginaAtual + 2
                    ) {
                      return (
                        <span
                          key={pagina}
                          className="px-1 text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))
                  }
                  disabled={paginaAtual === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Visualizar */}
      <Dialog open={dialogVisualizar} onOpenChange={setDialogVisualizar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>
          {clienteSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-semibold">{clienteSelecionado.nome}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Servidor</Label>
                  <p className="font-semibold">{clienteSelecionado.servidor}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Data de Entrada
                  </Label>
                  <p className="font-semibold">
                    {formatarData(clienteSelecionado.dataEntrada)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Data de Vencimento
                  </Label>
                  <p className="font-semibold">
                    {formatarData(clienteSelecionado.dataVencimento)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Dias Restantes
                  </Label>
                  <p className="font-semibold">
                    {clienteSelecionado.diasRestantes}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(
                      clienteSelecionado.status,
                      clienteSelecionado.diasRestantes
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Situação</Label>
                  <div className="mt-1">
                    {getSituacaoBadge(clienteSelecionado.situacao)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Valor</Label>
                  <p className="font-semibold">
                    {formatarMoeda(clienteSelecionado.valor)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Telas</Label>
                  <p className="font-semibold">
                    {clienteSelecionado.telas || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Custo do Servidor
                  </Label>
                  <p className="font-semibold">
                    {formatarMoeda(clienteSelecionado.custoServidor || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Lucro do Cliente
                  </Label>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatarMoeda(clienteSelecionado.lucroCliente || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialogVisualizar(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir */}
      <AlertDialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente{" "}
              <strong>{clienteSelecionado?.nome}</strong>? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Renovar */}
      <AlertDialog open={dialogRenovar} onOpenChange={setDialogRenovar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar renovação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja renovar o cliente{" "}
              <strong>{clienteSelecionado?.nome}</strong> por mais 30 dias? A
              data de vencimento será atualizada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarRenovar}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Renovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
