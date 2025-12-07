import { useState, useRef } from "react";
import { useClienteStore } from "@/stores/clienteStore";
import { useServidorStore } from "@/stores/servidorStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  AlertTriangle,
  Database,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Configuracoes() {
  const clientes = useClienteStore((state) => state.clientes);
  const servidores = useServidorStore((state) => state.servidores);
  const adicionarCliente = useClienteStore((state) => state.adicionarCliente);
  const limparTodosClientes = useClienteStore((state) => state.limparTodos);
  const servidoresList = servidores;

  const [dialogExcluirClientes, setDialogExcluirClientes] = useState(false);
  const [dialogExcluirServidores, setDialogExcluirServidores] = useState(false);
  const [dialogExcluirTudo, setDialogExcluirTudo] = useState(false);

  const [confirmarLimparClientes, setConfirmarLimparClientes] = useState(false);
  const [confirmarLimparServidores, setConfirmarLimparServidores] =
    useState(false);
  const [confirmarLimparTudo, setConfirmarLimparTudo] = useState(false);

  const handleLimparClientes = async () => {
    try {
      await limparTodosClientes();
      toast.success("Clientes limpos com sucesso!");
      setDialogExcluirClientes(false);
      setConfirmarLimparClientes(false);
    } catch (error) {
      console.error("Erro ao limpar clientes:", error);
      toast.error("Erro ao limpar clientes. Tente novamente.");
    }
  };

  const limparTodosServidores = useServidorStore((state) => state.limparTodos);

  const handleLimparServidores = async () => {
    try {
      await limparTodosServidores();
      toast.success("Servidores limpos com sucesso!");
      setDialogExcluirServidores(false);
      setConfirmarLimparServidores(false);
    } catch (error) {
      console.error("Erro ao limpar servidores:", error);
      toast.error("Erro ao limpar servidores. Tente novamente.");
    }
  };

  const handleLimparTudo = async () => {
    try {
      await Promise.all([limparTodosClientes(), limparTodosServidores()]);
      toast.success("Todos os dados foram limpos!");
      setDialogExcluirTudo(false);
      setConfirmarLimparTudo(false);
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      toast.error("Erro ao limpar dados. Tente novamente.");
    }
  };

  const fileInputRef = useRef(null);
  const planilhaInputRef = useRef(null);

  const handleExportarDados = () => {
    const dados = {
      clientes: clientes,
      servidores: servidores,
      dataExportacao: new Date().toISOString(),
      versao: "1.0",
    };

    const jsonString = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-sistema-clientes-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Dados exportados com sucesso!");
  };

  const handleImportarDados = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);

        if (!dados.clientes || !dados.servidores) {
          toast.error("Arquivo inválido. Formato esperado não encontrado.");
          return;
        }

        // Validar estrutura básica
        if (
          !Array.isArray(dados.clientes) ||
          !Array.isArray(dados.servidores)
        ) {
          toast.error("Arquivo inválido. Estrutura de dados incorreta.");
          return;
        }

        // Importar dados
        localStorage.setItem(
          "clientes-storage",
          JSON.stringify({
            state: { clientes: dados.clientes },
            version: 0,
          })
        );

        localStorage.setItem(
          "servidores-storage",
          JSON.stringify({
            state: { servidores: dados.servidores },
            version: 0,
          })
        );

        toast.success("Dados importados com sucesso! Recarregando...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Erro ao importar:", error);
        toast.error(
          "Erro ao importar arquivo. Verifique se o arquivo é válido."
        );
      }
    };
    reader.readAsText(file);

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  };

  const handleImportarPlanilha = () => {
    planilhaInputRef.current?.click();
  };

  const handlePlanilhaChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar extensão
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCSV = fileName.endsWith(".csv");

    if (!isExcel && !isCSV) {
      toast.error(
        "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)"
      );
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Procurar pela aba "Clientes" ou usar a primeira
          let sheetName =
            workbook.SheetNames.find((name) =>
              name.toLowerCase().includes("cliente")
            ) || workbook.SheetNames[0];

          const worksheet = workbook.Sheets[sheetName];

          // Converter para JSON - manter números brutos para datas do Excel
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: true, // Manter números brutos (importante para datas Excel)
            defval: null, // Usar null para células vazias
          });

          if (jsonData.length < 2) {
            toast.error("A planilha está vazia ou não tem dados suficientes");
            return;
          }

          // Procurar linha de cabeçalho (pode não ser a primeira linha)
          let headerRowIdx = 0;
          for (let i = 0; i < Math.min(20, jsonData.length); i++) {
            const row = jsonData[i];
            if (
              row &&
              row.some((cell) => {
                const cellStr = String(cell || "")
                  .toLowerCase()
                  .trim();
                return (
                  cellStr === "nome" ||
                  (cellStr.includes("nome") && cellStr.includes("cliente"))
                );
              })
            ) {
              headerRowIdx = i;
              break;
            }
          }

          // Linha de cabeçalhos
          const headers = jsonData[headerRowIdx].map((h) => {
            if (h === null || h === undefined) return "";
            return String(h).toLowerCase().trim();
          });

          // Mapear colunas possíveis (busca exata primeiro, depois parcial)
          const findColumn = (possibleNames) => {
            // Primeiro tenta busca exata
            for (const name of possibleNames) {
              const exactIdx = headers.findIndex((h) => h === name);
              if (exactIdx !== -1) return exactIdx;
            }
            // Depois tenta busca parcial
            return headers.findIndex((h) => {
              if (!h || typeof h !== "string") return false;
              return possibleNames.some(
                (name) => h.includes(name) || name.includes(h)
              );
            });
          };

          const nomeIdx = findColumn(["nome"]);
          const dataEntradaIdx = findColumn([
            "data de entrada",
            "data entrada",
            "entrada",
          ]);
          const dataVencimentoIdx = findColumn([
            "data de vencimento",
            "data vencimento",
            "vencimento",
            "venc",
          ]);
          const valorIdx = findColumn(["valor"]);
          const servidorIdx = findColumn(["servidor"]);
          const telasIdx = findColumn(["telas", "tela"]);
          const situacaoIdx = findColumn(["situação", "situacao", "situaçao"]);

          // Debug: mostrar cabeçalhos encontrados
          console.log("Cabeçalhos encontrados:", headers);
          console.log("Índices:", { nomeIdx, dataVencimentoIdx, valorIdx });

          if (nomeIdx === -1 || dataVencimentoIdx === -1 || valorIdx === -1) {
            const colunasFaltando = [];
            if (nomeIdx === -1) colunasFaltando.push("Nome");
            if (dataVencimentoIdx === -1)
              colunasFaltando.push("Data Vencimento");
            if (valorIdx === -1) colunasFaltando.push("Valor");

            toast.error(
              `Colunas obrigatórias não encontradas: ${colunasFaltando.join(
                ", "
              )}. Cabeçalhos encontrados: ${headers
                .filter((h) => h)
                .join(", ")}`
            );
            return;
          }

          // Função para converter data para string YYYY-MM-DD sem problemas de timezone
          const formatarDataParaString = (date) => {
            if (!date || isNaN(date.getTime())) return null;
            const ano = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, "0");
            const dia = String(date.getDate()).padStart(2, "0");
            return `${ano}-${mes}-${dia}`;
          };

          // Função para converter data (suporta Excel serial, brasileiro DD/MM/YYYY e ISO)
          const parseData = (data) => {
            if (data === null || data === undefined || data === "") return null;

            // Se for número (data Excel serial - formato abreviado)
            if (typeof data === "number") {
              // Excel serial date: número de dias desde 1900-01-01
              // Excel conta 1900-01-01 como dia 1 (não dia 0)
              // Excel tem bug: considera 1900 como bissexto (29/02/1900 existe no Excel)

              // Converter número Excel para data JavaScript
              // Fórmula correta: (data - 1) dias desde 1900-01-01
              // Mas se data >= 60 (passou de 29/02/1900), subtrair 1 dia a mais
              const excelEpoch = new Date(1900, 0, 1); // 1900-01-01
              let dias = data - 1; // Excel conta 1900-01-01 como dia 1

              // Ajuste para o bug do Excel (29/02/1900 não existe na realidade)
              if (data >= 60) {
                dias = data - 2;
              }

              const excelDate = new Date(
                excelEpoch.getTime() + dias * 86400000
              );

              // Validar se a data resultante é válida
              if (!isNaN(excelDate.getTime())) {
                return excelDate;
              }
            }

            // Se for string
            if (typeof data === "string") {
              const trimmed = data.trim();
              if (!trimmed) return null;

              // Formato brasileiro DD/MM/YYYY ou DD/MM/YY
              const matchBR = trimmed.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
              );
              if (matchBR) {
                const dia = parseInt(matchBR[1], 10);
                const mes = parseInt(matchBR[2], 10) - 1; // Mês é 0-indexed
                let ano = parseInt(matchBR[3], 10);
                // Se ano tem 2 dígitos, assumir 2000+
                if (ano < 100) {
                  ano = ano < 50 ? 2000 + ano : 1900 + ano;
                }
                const date = new Date(ano, mes, dia);
                if (
                  !isNaN(date.getTime()) &&
                  date.getDate() === dia &&
                  date.getMonth() === mes
                ) {
                  return date;
                }
              }

              // Tentar parse padrão (ISO, etc)
              const date = new Date(trimmed);
              if (!isNaN(date.getTime())) {
                return date;
              }
            }

            return null;
          };

          let importados = 0;
          let erros = 0;
          const errosDetalhes = [];

          // Processar cada linha (pular cabeçalho)
          for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Pular linhas vazias
            if (!row || row.every((cell) => !cell)) continue;

            try {
              const nome = String(row[nomeIdx] || "").trim();
              if (!nome) continue; // Pular se não tiver nome

              // Data de entrada (opcional, usar hoje se não tiver)
              let dataEntrada = parseData(row[dataEntradaIdx]);
              if (!dataEntrada || isNaN(dataEntrada.getTime())) {
                dataEntrada = new Date();
              }
              const dataEntradaStr = formatarDataParaString(dataEntrada);

              // Data de vencimento (obrigatória)
              let dataVencimento = parseData(row[dataVencimentoIdx]);
              if (!dataVencimento || isNaN(dataVencimento.getTime())) {
                erros++;
                errosDetalhes.push(
                  `Linha ${i + 1}: Data de vencimento inválida (${
                    row[dataVencimentoIdx]
                  })`
                );
                continue;
              }
              const dataVencimentoStr = formatarDataParaString(dataVencimento);

              // Valor (obrigatório)
              let valor = row[valorIdx];
              if (typeof valor === "string") {
                valor = parseFloat(
                  valor.replace(/[^\d,.-]/g, "").replace(",", ".")
                );
              }
              valor = parseFloat(valor) || 0;

              // Servidor (opcional, mas necessário para cálculos)
              let servidor =
                servidorIdx !== -1 ? String(row[servidorIdx] || "").trim() : "";
              if (!servidor && servidoresList.length > 0) {
                servidor = servidoresList[0].nome; // Usar primeiro servidor se não especificado
              }

              // Telas (opcional)
              let telas = telasIdx !== -1 ? parseInt(row[telasIdx]) || 0 : 0;

              // Situação (opcional, padrão PENDENTE)
              let situacao =
                situacaoIdx !== -1
                  ? String(row[situacaoIdx] || "")
                      .trim()
                      .toUpperCase()
                  : "PENDENTE";

              // Converter "A PAGAR" para "PENDENTE"
              if (situacao === "A PAGAR" || situacao === "A PAGAR") {
                situacao = "PENDENTE";
              } else if (situacao !== "PAGO" && situacao !== "PENDENTE") {
                situacao = "PENDENTE";
              }

              // Buscar servidor para pegar custo base
              const servidorObj = servidoresList.find(
                (s) => s.nome === servidor
              );
              const valorDoServidor = servidorObj?.custoBase || 0;

              // Se não encontrar servidor e houver servidores cadastrados, usar o primeiro
              if (!servidor && servidoresList.length > 0) {
                servidor = servidoresList[0].nome;
              }

              // Criar cliente
              await adicionarCliente({
                nome,
                dataEntrada: dataEntradaStr,
                dataVencimento: dataVencimentoStr,
                valor,
                situacao,
                servidor: servidor || "Não especificado",
                telas,
                valorDoServidor,
              });

              importados++;
            } catch (error) {
              erros++;
              errosDetalhes.push(`Linha ${i + 1}: ${error.message}`);
              console.error(`Erro ao importar linha ${i + 1}:`, error);
            }
          }

          if (importados > 0) {
            toast.success(
              `${importados} cliente(s) importado(s) com sucesso!${
                erros > 0 ? ` (${erros} erro(s))` : ""
              }`
            );
          } else {
            toast.error(
              "Nenhum cliente foi importado. Verifique o formato da planilha."
            );
          }

          if (erros > 0 && errosDetalhes.length > 0) {
            console.warn("Erros de importação:", errosDetalhes);
          }
        } catch (error) {
          console.error("Erro ao processar planilha:", error);
          toast.error(
            "Erro ao processar planilha. Verifique o formato do arquivo."
          );
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      toast.error("Erro ao ler arquivo. Tente novamente.");
    }

    // Limpar input
    event.target.value = "";
  };

  return (
    <div className="flex-1 space-y-3 p-3 md:p-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Configurações</h2>
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
              <Button
                onClick={handleImportarPlanilha}
                className="w-full"
                variant="outline"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar Planilha (Excel/CSV)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={planilhaInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handlePlanilhaChange}
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
          <CardContent className="flex-1">
            <div className="flex flex-col h-full justify-between gap-3">
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
            <p>Sistema de Gestão de Clientes - Versão 1.0</p>
            <p>Desenvolvido com React + Vite, TailwindCSS e shadcn/ui</p>
            <p>
              Todos os dados são armazenados localmente no navegador usando
              LocalStorage.
            </p>
            <p className="mt-2">
              <strong>Importante:</strong> Os dados são salvos no navegador do
              dispositivo. Para sincronizar entre dispositivos, use a função de
              Exportar/Importar dados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog Excluir Clientes */}
      <AlertDialog
        open={dialogExcluirClientes}
        onOpenChange={(open) => {
          setDialogExcluirClientes(open);
          if (!open) setConfirmarLimparClientes(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os clientes? Esta ação não
              pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirmar-clientes-dialog"
              checked={confirmarLimparClientes}
              onCheckedChange={(checked) => setConfirmarLimparClientes(checked)}
              className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
            />
            <Label
              htmlFor="confirmar-clientes-dialog"
              className="text-sm font-normal cursor-pointer"
            >
              Confirmo que desejo limpar todos os clientes
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLimparClientes}
              disabled={!confirmarLimparClientes}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpar Clientes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Excluir Servidores */}
      <AlertDialog
        open={dialogExcluirServidores}
        onOpenChange={(open) => {
          setDialogExcluirServidores(open);
          if (!open) setConfirmarLimparServidores(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os servidores? Esta ação não
              pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirmar-servidores-dialog"
              checked={confirmarLimparServidores}
              onCheckedChange={(checked) =>
                setConfirmarLimparServidores(checked)
              }
              className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
            />
            <Label
              htmlFor="confirmar-servidores-dialog"
              className="text-sm font-normal cursor-pointer"
            >
              Confirmo que desejo limpar todos os servidores
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLimparServidores}
              disabled={!confirmarLimparServidores}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpar Servidores
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Excluir Tudo */}
      <AlertDialog
        open={dialogExcluirTudo}
        onOpenChange={(open) => {
          setDialogExcluirTudo(open);
          if (!open) setConfirmarLimparTudo(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar TODOS os dados do sistema? Esta ação
              não pode ser desfeita e todos os clientes e servidores serão
              perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirmar-tudo-dialog"
              checked={confirmarLimparTudo}
              onCheckedChange={(checked) => setConfirmarLimparTudo(checked)}
              className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
            />
            <Label
              htmlFor="confirmar-tudo-dialog"
              className="text-sm font-normal cursor-pointer"
            >
              Confirmo que desejo limpar todos os dados
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLimparTudo}
              disabled={!confirmarLimparTudo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
