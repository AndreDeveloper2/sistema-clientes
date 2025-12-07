import { parseISO } from "date-fns";

/**
 * Calcula o status do cliente baseado na data de vencimento
 * Retorna 'VENCE HOJE' quando diasRestantes === 0
 */
export function calcularStatus(dataVencimento, diasRestantes = null) {
  // Se diasRestantes foi passado, usar ele diretamente
  if (diasRestantes !== null) {
    if (diasRestantes === 0) {
      return "VENCE HOJE";
    }
    if (diasRestantes < 0) {
      return "VENCIDO";
    }
    if (diasRestantes <= 5) {
      return "A VENCER";
    }
    return "EM DIA";
  }

  // Se não foi passado, calcular
  const dias = calcularDiasRestantes(dataVencimento);

  if (dias === 0) {
    return "VENCE HOJE";
  }

  if (dias < 0) {
    return "VENCIDO";
  }

  if (dias <= 5) {
    return "A VENCER";
  }

  return "EM DIA";
}

/**
 * Calcula os dias restantes até o vencimento
 * Usa startOfDay para evitar problemas de timezone
 * Calcula a diferença em milissegundos e converte para dias
 */
export function calcularDiasRestantes(dataVencimento) {
  // Criar data de hoje no início do dia (00:00:00) no timezone local
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Criar data de vencimento no início do dia (00:00:00) no timezone local
  let vencimento;
  if (typeof dataVencimento === "string" && dataVencimento.includes("T")) {
    // Se tem T, é formato ISO com timezone
    const date = parseISO(dataVencimento);
    vencimento = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  } else if (typeof dataVencimento === "string") {
    // Formato YYYY-MM-DD - criar data no timezone local
    const [ano, mes, dia] = dataVencimento.split("-").map(Number);
    vencimento = new Date(ano, mes - 1, dia);
  } else {
    // Se já é um objeto Date
    const date = new Date(dataVencimento);
    vencimento = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Garantir que está no início do dia
  vencimento.setHours(0, 0, 0, 0);

  // Calcular diferença em milissegundos e converter para dias
  const diffMs = vencimento.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDias;
}

/**
 * Formata data para exibição
 * Cria a data no timezone local para evitar problemas de conversão UTC
 */
export function formatarData(data) {
  if (!data) return "-";

  // Se for string no formato YYYY-MM-DD, criar data no timezone local
  if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const date = new Date(ano, mes - 1, dia);
    return date.toLocaleDateString("pt-BR");
  }

  // Se for string com T (ISO), usar parseISO e criar no timezone local
  if (typeof data === "string" && data.includes("T")) {
    const date = parseISO(data);
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return localDate.toLocaleDateString("pt-BR");
  }

  // Se já é um objeto Date, criar no timezone local
  if (data instanceof Date) {
    const localDate = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );
    return localDate.toLocaleDateString("pt-BR");
  }

  // Fallback: tentar criar Date normalmente
  const date = new Date(data);
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  return localDate.toLocaleDateString("pt-BR");
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}
