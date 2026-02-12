import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')

    const database = getDb()

    // OS receitas no periodo
    let osQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN liquidado = 1 THEN COALESCE(valor_pago, valor, 0) ELSE 0 END), 0) as os_recebido,
        COALESCE(SUM(CASE WHEN liquidado = 0 AND status != 'cancelada' THEN COALESCE(valor, 0) ELSE 0 END), 0) as os_pendente,
        COUNT(CASE WHEN liquidado = 1 THEN 1 END) as os_recebido_count,
        COUNT(CASE WHEN liquidado = 0 AND status != 'cancelada' THEN 1 END) as os_pendente_count
      FROM ordens_servico WHERE user_id = ?
    `
    const osParams: any[] = [userId]
    if (data_inicio) { osQuery += ' AND data_execucao >= ?'; osParams.push(data_inicio) }
    if (data_fim) { osQuery += ' AND data_execucao <= ?'; osParams.push(data_fim) }
    const osResumo = database.prepare(osQuery).get(...osParams) as any

    // Parcelas receitas no periodo
    let parcelasQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'paga' THEN COALESCE(p.valor_pago, p.valor_parcela, 0) ELSE 0 END), 0) as parcelas_recebido,
        COALESCE(SUM(CASE WHEN p.status IN ('pendente', 'atrasada') THEN p.valor_parcela ELSE 0 END), 0) as parcelas_pendente,
        COUNT(CASE WHEN p.status = 'paga' THEN 1 END) as parcelas_pago_count,
        COUNT(CASE WHEN p.status IN ('pendente', 'atrasada') THEN 1 END) as parcelas_pendente_count,
        COUNT(CASE WHEN p.status = 'atrasada' OR (p.status = 'pendente' AND p.data_vencimento < date('now')) THEN 1 END) as parcelas_atrasadas_count
      FROM parcelas p
      LEFT JOIN contratos c ON p.contrato_id = c.id
      WHERE c.user_id = ? AND c.status = 'ativo'
    `
    const parcelasParams: any[] = [userId]
    if (data_inicio) { parcelasQuery += ' AND p.data_vencimento >= ?'; parcelasParams.push(data_inicio) }
    if (data_fim) { parcelasQuery += ' AND p.data_vencimento <= ?'; parcelasParams.push(data_fim) }
    const parcelasResumo = database.prepare(parcelasQuery).get(...parcelasParams) as any

    // Lancamentos manuais no periodo
    let lancQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'pago' THEN valor ELSE 0 END), 0) as receitas_pagas,
        COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'pendente' THEN valor ELSE 0 END), 0) as receitas_pendentes,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END), 0) as despesas_pagas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pendente' THEN valor ELSE 0 END), 0) as despesas_pendentes
      FROM lancamentos_financeiros WHERE user_id = ?
    `
    const lancParams: any[] = [userId]
    if (data_inicio) { lancQuery += ' AND data_lancamento >= ?'; lancParams.push(data_inicio) }
    if (data_fim) { lancQuery += ' AND data_lancamento <= ?'; lancParams.push(data_fim) }
    const lancResumo = database.prepare(lancQuery).get(...lancParams) as any

    // Receitas/Despesas por mes (ultimos 6 meses)
    const chartData = database.prepare(`
      SELECT 
        strftime('%Y-%m', data_ref) as mes,
        SUM(receita) as receitas,
        SUM(despesa) as despesas
      FROM (
        SELECT data_execucao as data_ref, COALESCE(valor_pago, valor, 0) as receita, 0 as despesa
        FROM ordens_servico WHERE user_id = ? AND liquidado = 1
        UNION ALL
        SELECT p.data_pagamento as data_ref, COALESCE(p.valor_pago, p.valor_parcela, 0) as receita, 0 as despesa
        FROM parcelas p LEFT JOIN contratos c ON p.contrato_id = c.id 
        WHERE c.user_id = ? AND p.status = 'paga' AND p.data_pagamento IS NOT NULL
        UNION ALL
        SELECT data_lancamento as data_ref, 
          CASE WHEN tipo = 'receita' THEN valor ELSE 0 END as receita,
          CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END as despesa
        FROM lancamentos_financeiros WHERE user_id = ? AND status = 'pago'
      )
      WHERE data_ref >= date('now', '-6 months')
      GROUP BY mes
      ORDER BY mes ASC
    `).all(userId, userId, userId)

    // Despesas por categoria
    const despesasPorCategoria = database.prepare(`
      SELECT 
        COALESCE(c.nome, 'Sem Categoria') as categoria,
        COALESCE(c.cor, '#6b7280') as cor,
        SUM(l.valor) as total
      FROM lancamentos_financeiros l
      LEFT JOIN categorias_financeiras c ON l.categoria_id = c.id
      WHERE l.user_id = ? AND l.tipo = 'despesa' AND l.status = 'pago'
      GROUP BY l.categoria_id
      ORDER BY total DESC
    `).all(userId)

    const totalReceitaRealizado = osResumo.os_recebido + parcelasResumo.parcelas_recebido + lancResumo.receitas_pagas
    const totalDespesaRealizado = lancResumo.despesas_pagas
    const totalAReceber = osResumo.os_pendente + parcelasResumo.parcelas_pendente + lancResumo.receitas_pendentes
    const totalAPagar = lancResumo.despesas_pendentes

    return NextResponse.json({
      receita_total: totalReceitaRealizado,
      despesa_total: totalDespesaRealizado,
      lucro_liquido: totalReceitaRealizado - totalDespesaRealizado,
      a_receber: totalAReceber,
      a_pagar: totalAPagar,
      os: osResumo,
      parcelas: parcelasResumo,
      lancamentos: lancResumo,
      chart_mensal: chartData,
      despesas_por_categoria: despesasPorCategoria
    })
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
