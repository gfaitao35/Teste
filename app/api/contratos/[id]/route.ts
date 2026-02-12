import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const database = getDb()

    // Buscar dados do contrato
    const contrato = database.prepare(`
      SELECT c.*, cl.razao_social, cl.nome_fantasia
      FROM contratos c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = ? AND c.user_id = ?
    `).get(params.id, userId) as any

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    // Buscar parcelas do contrato
    const parcelas = database.prepare(`
      SELECT * FROM parcelas
      WHERE contrato_id = ?
      ORDER BY numero_parcela ASC
    `).all(params.id) as any[]

    return NextResponse.json({
      contrato,
      parcelas
    })

  } catch (error) {
    console.error('Erro ao buscar contrato:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
