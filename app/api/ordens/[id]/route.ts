import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    console.log('[API Ordens] GET request, userId:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Handle both Promise and non-Promise params (Next.js version compatibility)
    const resolvedParams = await Promise.resolve(params)
    const orderId = resolvedParams.id
    console.log('[API Ordens] Looking for order:', orderId)

    const database = getDb()

    // Buscar ordem de serviço com dados do cliente
    const ordem = database.prepare(`
      SELECT o.*, 
             c.razao_social as cliente_razao_social, 
             c.nome_fantasia as cliente_nome_fantasia
      FROM ordens_servico o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(orderId, userId) as any

    if (!ordem) {
      console.error('[API] Order not found:', { orderId, userId })
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 })
    }

    // Estruturar os dados para o frontend
    const ordemFormatada = {
      id: ordem.id,
      numero_os: ordem.numero_os,
      cliente_id: ordem.cliente_id,
      cliente: {
        razao_social: ordem.cliente_razao_social,
        nome_fantasia: ordem.cliente_nome_fantasia
      },
      data_execucao: ordem.data_execucao,
      tipo_servico: ordem.tipo_servico,
      descricao_servico: ordem.descricao_servico,
      local_execucao: ordem.local_execucao,
      equipamentos_utilizados: ordem.equipamentos_utilizados,
      produtos_aplicados: ordem.produtos_aplicados,
      area_tratada: ordem.area_tratada,
      pragas_alvo: ordem.pragas_alvo,
      observacoes: ordem.observacoes,
      tecnico_responsavel: ordem.tecnico_responsavel,
      status: ordem.status,
      valor: ordem.valor,
      liquidado: ordem.liquidado === 1,
      data_liquidacao: ordem.data_liquidacao,
      valor_pago: ordem.valor_pago,
      garantia_meses: ordem.garantia_meses,
      visitas_gratuitas: ordem.visitas_gratuitas || 0,
      created_at: ordem.created_at
    }

    return NextResponse.json(ordemFormatada)

  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
