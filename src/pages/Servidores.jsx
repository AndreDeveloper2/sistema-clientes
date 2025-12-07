import { useState } from "react";
import { useServidorStore } from "@/stores/servidorStore";
import { useClienteStore } from "@/stores/clienteStore";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatarMoeda } from "@/lib/clienteUtils";

export default function Servidores() {
  const servidores = useServidorStore((state) => state.servidores);
  const clientes = useClienteStore((state) => state.clientes);
  const adicionarServidor = useServidorStore(
    (state) => state.adicionarServidor
  );
  const atualizarServidor = useServidorStore(
    (state) => state.atualizarServidor
  );
  const excluirServidor = useServidorStore((state) => state.excluirServidor);
  const getEstatisticasServidor = useServidorStore(
    (state) => state.getEstatisticasServidor
  );

  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogExcluir, setDialogExcluir] = useState(false);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    custoBase: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const dados = {
      ...formData,
      custoBase: parseFloat(formData.custoBase),
    };

    if (modoEdicao && servidorSelecionado) {
      atualizarServidor(servidorSelecionado.id, dados);
      toast.success("Servidor atualizado com sucesso!");
    } else {
      adicionarServidor(dados);
      toast.success("Servidor adicionado com sucesso!");
    }

    resetForm();
    setDialogAberto(false);
  };

  const handleEditar = (servidor) => {
    setServidorSelecionado(servidor);
    setModoEdicao(true);
    setFormData({
      nome: servidor.nome,
      custoBase: servidor.custoBase.toString(),
    });
    setDialogAberto(true);
  };

  const handleExcluirClick = (servidor) => {
    // Verificar se há clientes usando este servidor
    const clientesUsandoServidor = clientes.filter(
      (c) => c.servidor === servidor.nome
    );

    if (clientesUsandoServidor.length > 0) {
      toast.error(
        `Não é possível excluir o servidor. Existem ${clientesUsandoServidor.length} cliente(s) usando este servidor.`
      );
      return;
    }

    setServidorSelecionado(servidor);
    setDialogExcluir(true);
  };

  const confirmarExcluir = () => {
    if (servidorSelecionado) {
      excluirServidor(servidorSelecionado.id);
      toast.success("Servidor excluído com sucesso!");
      setDialogExcluir(false);
      setServidorSelecionado(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      custoBase: "",
    });
    setServidorSelecionado(null);
    setModoEdicao(false);
  };

  const abrirDialogNovo = () => {
    resetForm();
    setDialogAberto(true);
  };

  return (
    <div className="flex-1 space-y-3 p-3 md:p-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Servidores</h2>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Servidor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modoEdicao ? "Editar Servidor" : "Novo Servidor"}
              </DialogTitle>
              <DialogDescription>
                {modoEdicao
                  ? "Atualize as informações do servidor"
                  : "Preencha os dados do novo servidor"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Servidor *</Label>
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
                <Label htmlFor="custoBase">Custo Base (R$) *</Label>
                <Input
                  id="custoBase"
                  type="number"
                  step="0.01"
                  value={formData.custoBase}
                  onChange={(e) =>
                    setFormData({ ...formData, custoBase: e.target.value })
                  }
                  required
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
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

      {/* Versão Mobile - Cards */}
      <div className="block md:hidden">
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="space-y-3">
            {servidores.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum servidor cadastrado
              </div>
            ) : (
              servidores.map((servidor, index) => {
                const stats = getEstatisticasServidor(servidor.id);
                const isPar = index % 2 === 0;

                return (
                  <Card
                    key={servidor.id}
                    className={`text-sm p-3 server-card-${
                      isPar ? "odd" : "even"
                    } ${isPar ? "border" : ""}`}
                  >
                    <div className="pb-2">
                      <h3 className="text-base font-semibold truncate">
                        {servidor.nome}
                      </h3>
                    </div>
                    <div className="space-y-2 pt-0">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Custo Base:
                        </span>
                        <span className="font-semibold">
                          {formatarMoeda(servidor.custoBase)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Total de Clientes:
                        </span>
                        <span className="font-semibold">
                          {stats?.totalClientes || 0}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Custo Total:
                        </span>
                        <span className="font-semibold">
                          {formatarMoeda(stats?.custoTotal || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Valor Recebido:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatarMoeda(stats?.valorRecebido || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Lucro Total:
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatarMoeda(stats?.lucroTotal || 0)}
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
                            onClick={() => handleEditar(servidor)}
                            className="h-7 w-7 text-green-600 dark:text-green-400"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluirClick(servidor)}
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
        </div>
      </div>

      {/* Versão Desktop - Tabela */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Lista de Servidores</CardTitle>
          <CardDescription>
            {servidores.length} servidor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Custo Base</TableHead>
                  <TableHead>Total de Clientes</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead>Valor Recebido</TableHead>
                  <TableHead>Lucro Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servidores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum servidor cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  servidores.map((servidor) => {
                    const stats = getEstatisticasServidor(servidor.id);
                    return (
                      <TableRow key={servidor.id}>
                        <TableCell className="font-medium">
                          {servidor.nome}
                        </TableCell>
                        <TableCell>
                          {formatarMoeda(servidor.custoBase)}
                        </TableCell>
                        <TableCell>{stats?.totalClientes || 0}</TableCell>
                        <TableCell>
                          {formatarMoeda(stats?.custoTotal || 0)}
                        </TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">
                          {formatarMoeda(stats?.valorRecebido || 0)}
                        </TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400">
                          {formatarMoeda(stats?.lucroTotal || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditar(servidor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExcluirClick(servidor)}
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
        </CardContent>
      </Card>

      {/* AlertDialog Excluir */}
      <AlertDialog open={dialogExcluir} onOpenChange={setDialogExcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o servidor{" "}
              <strong>{servidorSelecionado?.nome}</strong>? Esta ação não pode
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
