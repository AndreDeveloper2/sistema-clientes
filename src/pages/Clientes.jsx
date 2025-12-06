import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { formatarData, formatarMoeda } from "@/lib/clienteUtils";

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
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

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
        // Mais longe primeiro (datas mais futuras primeiro)
        return dataB - dataA;
      } else {
        // Mais perto primeiro (datas mais próximas primeiro)
        return dataA - dataB;
      }
    });

  const handleOrdenarVencimento = (direcao) => {
    if (ordenacaoVencimento === direcao) {
      setOrdenacaoVencimento(null); // Remove ordenação se clicar no mesmo
    } else {
      setOrdenacaoVencimento(direcao);
    }
  };

  const getStatusBadge = (status, diasRestantes) => {
    if (status === "VENCIDO" || diasRestantes < 0) {
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20">
          VENCIDO
        </Badge>
      );
    }

    if (diasRestantes <= 5 && diasRestantes >= 0) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20">
          A VENCER
        </Badge>
      );
    }

    // EM DIA (mais de 5 dias)
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

  const handleRenovar = (cliente) => {
    renovarCliente(cliente.id);
    toast.success(`Cliente ${cliente.nome} renovado com sucesso!`);
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
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe seus pagamentos
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNovo}>
              <Plus className="mr-2 h-4 w-4" />
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
                  <Input
                    id="dataEntrada"
                    type="date"
                    value={formData.dataEntrada}
                    onChange={(e) =>
                      setFormData({ ...formData, dataEntrada: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataVencimento: e.target.value,
                      })
                    }
                    required
                  />
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogAberto(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {modoEdicao ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
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
      <div className="block md:hidden space-y-4">
        {clientesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum cliente encontrado
            </CardContent>
          </Card>
        ) : (
          clientesFiltrados.map((cliente) => (
            <Card key={cliente.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                    <CardDescription>{cliente.servidor}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleVisualizar(cliente)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditar(cliente)}>
                        <Edit className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRenovar(cliente)}>
                        <Zap className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        Renovar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleExcluirClick(cliente)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span className="font-medium">
                    {formatarData(cliente.dataVencimento)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    {formatarMoeda(cliente.valor)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(cliente.status, cliente.diasRestantes)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Nome</TableHead>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      <span>Vencimento</span>
                      <div className="flex flex-col gap-0">
                        <button
                          onClick={() => handleOrdenarVencimento("asc")}
                          className={`hover:bg-accent/50 rounded transition-colors ${
                            ordenacaoVencimento === "asc" ? "bg-accent/50" : ""
                          }`}
                          title="Ordenar: mais longe primeiro"
                        >
                          <ChevronUp className="h-3 w-3 text-muted-foreground opacity-60" />
                        </button>
                        <button
                          onClick={() => handleOrdenarVencimento("desc")}
                          className={`hover:bg-accent/50 rounded transition-colors ${
                            ordenacaoVencimento === "desc" ? "bg-accent/50" : ""
                          }`}
                          title="Ordenar: mais perto primeiro"
                        >
                          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
                        </button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="pr-6 w-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium pl-6">
                        {cliente.nome}
                      </TableCell>
                      <TableCell>{cliente.servidor}</TableCell>
                      <TableCell>{formatarData(cliente.dataEntrada)}</TableCell>
                      <TableCell>
                        {formatarData(cliente.dataVencimento)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            cliente.diasRestantes < 0
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : cliente.diasRestantes <= 7
                              ? "text-yellow-600 dark:text-yellow-400 font-medium"
                              : ""
                          }
                        >
                          {cliente.diasRestantes}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cliente.status, cliente.diasRestantes)}
                      </TableCell>
                      <TableCell>
                        {getSituacaoBadge(cliente.situacao)}
                      </TableCell>
                      <TableCell>{formatarMoeda(cliente.valor)}</TableCell>
                      <TableCell className="pr-6">
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
                            onClick={() => handleRenovar(cliente)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
    </div>
  );
}
