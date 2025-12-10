import { useState, useMemo } from "react";
import { useLogStore } from "@/stores/logStore";
import { useClienteStore } from "@/stores/clienteStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Trash2,
} from "lucide-react";
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
import { formatarData, formatarMoeda } from "@/lib/clienteUtils";
import { toast } from "sonner";

export default function Logs() {
  const logs = useLogStore((state) => state.logs);
  const limparTodos = useLogStore((state) => state.limparTodos);
  const recuperarCliente = useLogStore((state) => state.recuperarCliente);
  const marcarComoRecuperado = useLogStore(
    (state) => state.marcarComoRecuperado
  );
  const adicionarCliente = useClienteStore((state) => state.adicionarCliente);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [logSelecionado, setLogSelecionado] = useState(null);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [dialogRecuperar, setDialogRecuperar] = useState(false);
  const [dialogLimpar, setDialogLimpar] = useState(false);

  // Filtrar logs
  const logsFiltrados = useMemo(() => {
    if (filtroTipo === "TODOS") return logs;
    return logs.filter((log) => log.tipo === filtroTipo);
  }, [logs, filtroTipo]);

  const getTipoBadge = (tipo) => {
    const tipos = {
      CRIACAO: {
        label: "Criação",
        className:
          "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      },
      EDICAO: {
        label: "Edição",
        className:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      },
      EXCLUSAO: {
        label: "Exclusão",
        className:
          "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      },
      RENOVACAO: {
        label: "Renovação",
        className:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      },
      CANCELAMENTO: {
        label: "Cancelamento",
        className:
          "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      },
      RESTAURACAO: {
        label: "Restauração",
        className:
          "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      },
      APLICACAO_JUROS: {
        label: "Aplicação de Juros",
        className:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      },
      REGISTRO_INDICACAO: {
        label: "Registro de Indicação",
        className:
          "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      },
    };
    const tipoInfo = tipos[tipo] || { label: tipo, className: "" };
    return <Badge className={tipoInfo.className}>{tipoInfo.label}</Badge>;
  };

  const formatarTimestamp = (timestamp) => {
    const data = new Date(timestamp);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVisualizarDetalhes = (log) => {
    setLogSelecionado(log);
    setDialogDetalhes(true);
  };

  const handleRecuperarCliente = (logId) => {
    const cliente = recuperarCliente(logId);
    if (cliente) {
      setLogSelecionado(logs.find((l) => l.id === logId));
      setDialogRecuperar(true);
    } else {
      toast.error("Não foi possível recuperar os dados do cliente.");
    }
  };

  const confirmarRecuperar = async () => {
    if (logSelecionado) {
      const cliente = recuperarCliente(logSelecionado.id);
      if (cliente) {
        try {
          // Remover o ID antigo e deixar o adicionarCliente gerar um novo
          const { id: _, ...clienteSemId } = cliente;
          const novoCliente = await adicionarCliente(clienteSemId);

          // Adicionar log específico de restauração
          useLogStore.getState().adicionarLog({
            tipo: "RESTAURACAO",
            entidade: "CLIENTE",
            entidadeId: novoCliente.id,
            descricao: `Cliente "${cliente.nome}" foi restaurado`,
            dados: {
              clienteRestaurado: novoCliente,
              clienteOriginal: cliente,
              logExclusaoId: logSelecionado.id,
              detalhes: {
                nome: cliente.nome,
                valor: cliente.valor,
                servidor: cliente.servidor,
                situacao: cliente.situacao,
              },
            },
          });

          // Marcar o log como recuperado para evitar recuperação duplicada
          marcarComoRecuperado(logSelecionado.id);
          toast.success(`Cliente "${cliente.nome}" recuperado com sucesso!`);
          setDialogRecuperar(false);
          setLogSelecionado(null);
        } catch {
          toast.error("Erro ao recuperar cliente. Tente novamente.");
        }
      }
    }
  };

  return (
    <div className="flex-1 space-y-3 p-3 md:p-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Logs do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Histórico de todas as ações realizadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              <SelectItem value="CRIACAO">Criações</SelectItem>
              <SelectItem value="EDICAO">Edições</SelectItem>
              <SelectItem value="EXCLUSAO">Exclusões</SelectItem>
              <SelectItem value="RENOVACAO">Renovações</SelectItem>
              <SelectItem value="CANCELAMENTO">Cancelamentos</SelectItem>
              <SelectItem value="RESTAURACAO">Restaurações</SelectItem>
              <SelectItem value="APLICACAO_JUROS">
                Aplicações de Juros
              </SelectItem>
              <SelectItem value="REGISTRO_INDICACAO">
                Registros de Indicação
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDialogLimpar(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Logs
          </Button>
        </div>
      </div>

      {/* Versão Mobile - Cards */}
      <div className="block custom-md:hidden">
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="space-y-3">
            {logsFiltrados.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              logsFiltrados.map((log, index) => {
                const isPar = index % 2 === 0;
                return (
                  <Card
                    key={log.id}
                    className={`text-sm p-3 log-card-${
                      isPar ? "odd" : "even"
                    } ${isPar ? "border" : ""}`}
                  >
                    <div className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {formatarTimestamp(log.timestamp)}
                          </p>
                          <p className="text-base font-semibold mt-1">
                            {log.descricao}
                          </p>
                        </div>
                        <div className="flex-shrink-0 pt-0.5 flex flex-col gap-1 items-end">
                          {getTipoBadge(log.tipo)}
                          {log.sincronizado ? (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sincronizado
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Ações:
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVisualizarDetalhes(log)}
                          className="h-7 w-7"
                          title="Ver detalhes"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        {log.tipo === "EXCLUSAO" && !log.recuperado && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRecuperarCliente(log.id)}
                            className="h-7 w-7 text-green-600 dark:text-green-400"
                            title="Recuperar cliente"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Versão Desktop - Tabela */}
      <Card className="hidden custom-md:block">
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            {logsFiltrados.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Sincronização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logsFiltrados.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatarTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>{getTipoBadge(log.tipo)}</TableCell>
                      <TableCell>{log.descricao}</TableCell>
                      <TableCell>
                        {log.sincronizado ? (
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sincronizado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVisualizarDetalhes(log)}
                            className="h-8 w-8"
                            title="Ver detalhes"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {log.tipo === "EXCLUSAO" && !log.recuperado && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRecuperarCliente(log.id)}
                              className="h-8 w-8 text-green-600 dark:text-green-400"
                              title="Recuperar cliente"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Dialog de Detalhes */}
      <Dialog open={dialogDetalhes} onOpenChange={setDialogDetalhes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações completas sobre esta ação
            </DialogDescription>
          </DialogHeader>
          {logSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipo
                  </p>
                  <p className="mt-1">{getTipoBadge(logSelecionado.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Data/Hora
                  </p>
                  <p className="mt-1">
                    {formatarTimestamp(logSelecionado.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sincronização
                  </p>
                  <p className="mt-1">
                    {logSelecionado.sincronizado ? (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sincronizado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Descrição
                  </p>
                  <p className="mt-1">{logSelecionado.descricao}</p>
                </div>
              </div>

              {logSelecionado.tipo === "EDICAO" &&
                logSelecionado.dados?.mudancas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Mudanças Realizadas
                    </p>
                    <div className="space-y-2">
                      {logSelecionado.dados.mudancas.map((mudanca, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted rounded-md text-sm"
                        >
                          <p className="font-medium capitalize">
                            {mudanca.campo}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {String(mudanca.valorAnterior ?? "N/A")}
                            </span>
                            <span>→</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {String(mudanca.valorNovo ?? "N/A")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "CRIACAO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Dados do Cliente Criado
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Nome:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">Valor:</span>{" "}
                        {formatarMoeda(logSelecionado.dados.detalhes.valor)}
                      </p>
                      <p>
                        <span className="font-medium">Servidor:</span>{" "}
                        {logSelecionado.dados.detalhes.servidor}
                      </p>
                      <p>
                        <span className="font-medium">Telas:</span>{" "}
                        {logSelecionado.dados.detalhes.telas}
                      </p>
                      <p>
                        <span className="font-medium">Situação:</span>{" "}
                        {logSelecionado.dados.detalhes.situacao}
                      </p>
                      <p>
                        <span className="font-medium">Data de Vencimento:</span>{" "}
                        {formatarData(
                          logSelecionado.dados.detalhes.dataVencimento
                        )}
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "RENOVACAO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Detalhes da Renovação
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Cliente:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">
                          Data Vencimento Anterior:
                        </span>{" "}
                        {formatarData(
                          logSelecionado.dados.detalhes.dataVencimentoAnterior
                        )}
                      </p>
                      <p>
                        <span className="font-medium">
                          Nova Data de Vencimento:
                        </span>{" "}
                        {formatarData(
                          logSelecionado.dados.detalhes.novaDataVencimento
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Situação Anterior:</span>{" "}
                        {logSelecionado.dados.detalhes.situacaoAnterior}
                      </p>
                      <p>
                        <span className="font-medium">Nova Situação:</span>{" "}
                        {logSelecionado.dados.detalhes.novaSituacao}
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "EXCLUSAO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Dados do Cliente Excluído
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Nome:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">Valor:</span>{" "}
                        {formatarMoeda(logSelecionado.dados.detalhes.valor)}
                      </p>
                      <p>
                        <span className="font-medium">Servidor:</span>{" "}
                        {logSelecionado.dados.detalhes.servidor}
                      </p>
                      <p>
                        <span className="font-medium">Situação:</span>{" "}
                        {logSelecionado.dados.detalhes.situacao}
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "CANCELAMENTO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Detalhes do Cancelamento
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Cliente:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">Ação:</span>{" "}
                        {logSelecionado.dados.detalhes.acao}
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "RESTAURACAO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Detalhes da Restauração
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Cliente:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">Valor:</span>{" "}
                        {formatarMoeda(logSelecionado.dados.detalhes.valor)}
                      </p>
                      <p>
                        <span className="font-medium">Servidor:</span>{" "}
                        {logSelecionado.dados.detalhes.servidor}
                      </p>
                      <p>
                        <span className="font-medium">Situação:</span>{" "}
                        {logSelecionado.dados.detalhes.situacao}
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "APLICACAO_JUROS" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Detalhes da Aplicação de Juros
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Cliente:</span>{" "}
                        {logSelecionado.dados.detalhes.nome}
                      </p>
                      <p>
                        <span className="font-medium">
                          Dias de Inadimplência:
                        </span>{" "}
                        {logSelecionado.dados.detalhes.diasInadimplente} dias
                      </p>
                      <p>
                        <span className="font-medium">Valor dos Juros:</span>{" "}
                        {formatarMoeda(
                          logSelecionado.dados.detalhes.valorJuros
                        )}
                      </p>
                      <p>
                        <span className="font-medium">
                          Valor da Mensalidade:
                        </span>{" "}
                        {formatarMoeda(
                          logSelecionado.dados.detalhes.valorMensalidade
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Valor Total:</span>{" "}
                        <strong className="text-orange-600 dark:text-orange-400">
                          {formatarMoeda(
                            logSelecionado.dados.detalhes.valorTotal
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}

              {logSelecionado.tipo === "REGISTRO_INDICACAO" &&
                logSelecionado.dados?.detalhes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Detalhes do Registro de Indicação
                    </p>
                    <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                      <p>
                        <span className="font-medium">Cliente Indicador:</span>{" "}
                        {logSelecionado.dados.detalhes.nomeIndicador}
                      </p>
                      <p>
                        <span className="font-medium">Cliente Indicado:</span>{" "}
                        {logSelecionado.dados.detalhes.nomeIndicado}
                      </p>
                      <p>
                        <span className="font-medium">Desconto Aplicado:</span>{" "}
                        {formatarMoeda(
                          logSelecionado.dados.detalhes.descontoAplicado
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Desconto Total:</span>{" "}
                        <strong className="text-purple-600 dark:text-purple-400">
                          {formatarMoeda(
                            logSelecionado.dados.detalhes.descontoTotal
                          )}
                        </strong>
                      </p>
                      <p>
                        <span className="font-medium">
                          Total de Clientes Indicados:
                        </span>{" "}
                        {logSelecionado.dados.detalhes.clientesIndicadosTotal}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialogDetalhes(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Limpar Logs */}
      <AlertDialog open={dialogLimpar} onOpenChange={setDialogLimpar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Todos os Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todos os logs? Esta ação não pode
              ser desfeita. Todos os registros serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                limparTodos();
                toast.success("Todos os logs foram limpos com sucesso!");
                setDialogLimpar(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todos os Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Recuperar Cliente */}
      <Dialog open={dialogRecuperar} onOpenChange={setDialogRecuperar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja recuperar este cliente? Ele será adicionado
              novamente ao sistema.
            </DialogDescription>
          </DialogHeader>
          {logSelecionado && logSelecionado.dados?.detalhes && (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Cliente:</span>{" "}
                {logSelecionado.dados.detalhes.nome}
              </p>
              <p className="text-sm">
                <span className="font-medium">Valor:</span>{" "}
                {formatarMoeda(logSelecionado.dados.detalhes.valor)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogRecuperar(false);
                setLogSelecionado(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarRecuperar}
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recuperar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
