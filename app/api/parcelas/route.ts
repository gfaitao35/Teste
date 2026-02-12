import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      contrato_id, 
      numero_parcela, 
      valor_parcela, 
      data_vencimento 
    } = body

    if (!contrato_id || !numero_parcela || !valor_parcela || !data_vencimento) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const database = getDb()

    // Verificar se o contrato existe e pertence ao usuário
    const contrato = database.prepare(`
      SELECT * FROM contratos 
      WHERE id = ? AND user_id = ?
    `).get(contrato_id, userId) as any

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    // Verificar se já existe uma parcela com esse número
    const parcelaExistente = database.prepare(`
      SELECT COUNT(*) as count FROM parcelas 
      WHERE contrato_id = ? AND numero_parcela = ?
    `).get(contrato_id, numero_parcela) as { count: number }

    if (parcelaExistente.count > 0) {
      return NextResponse.json({ error: 'Já existe uma parcela com esse número' }, { status: 400 })
    }

    // Inserir nova parcela
    const parcelaId = crypto.randomUUID()
    database.prepare(`
      INSERT INTO parcelas (
        id, contrato_id, numero_parcela, valor_parcela, data_vencimento, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pendente', datetime('now'))
    `).run(
      parcelaId,
      contrato_id,
      numero_parcela,
      valor_parcela,
      data_vencimento
    )

    return NextResponse.json({ 
      success: true, 
      parcela: {
        id: parcelaId,
        contrato_id,
        numero_parcela,
        valor_parcela,
        data_vencimento,
        status: 'pendente'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar parcela:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
