import { differenceInDays, isPast, isFuture, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

/**
 * Calcula o status do cliente baseado na data de vencimento
 */
export function calcularStatus(dataVencimento) {
  const hoje = new Date()
  const vencimento = new Date(dataVencimento)
  const inicioMesAtual = startOfMonth(hoje)
  const fimMesAtual = endOfMonth(hoje)

  // Se vence no mês atual
  if (isWithinInterval(vencimento, { start: inicioMesAtual, end: fimMesAtual })) {
    if (isPast(vencimento)) {
      return 'VENCIDO'
    } else {
      return 'A PAGAR'
    }
  }

  // Se vence em mês futuro
  if (isFuture(vencimento)) {
    return 'PAGO'
  }

  // Se já venceu no mês passado ou antes
  if (isPast(vencimento)) {
    return 'VENCIDO'
  }

  return 'A PAGAR'
}

/**
 * Calcula os dias restantes até o vencimento
 */
export function calcularDiasRestantes(dataVencimento) {
  const hoje = new Date()
  const vencimento = new Date(dataVencimento)
  const dias = differenceInDays(vencimento, hoje)
  return dias
}

/**
 * Formata data para exibição
 */
export function formatarData(data) {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR')
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

