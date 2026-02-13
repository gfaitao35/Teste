import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { toLocalDateInput } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    const { id } = await params as { id: string }
    console.log('[API] PUT /api/parcelas/:id - id=', id, 'userId=', userId)
    console.log('[API] request cookie header:', request.headers.get('cookie'))
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { status, data_pagamento, valor_pago, forma_pagamento } = body

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
    }

    const database = getDb()

    // Verificar se a parcela existe e pertence ao usuário
    const parcela = database.prepare(`
      SELECT p.*, c.user_id 
      FROM parcelas p
      LEFT JOIN contratos c ON p.contrato_id = c.id
      WHERE p.id = ? AND c.user_id = ?
    `).get(id, userId) as any

    if (!parcela) {
      return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 })
    }

    // Atualizar parcela
    const result = database.prepare(`
      UPDATE parcelas 
      SET status = ?, data_pagamento = ?, valor_pago = ?, forma_pagamento = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      status,
      data_pagamento || null,
      valor_pago || null,
      forma_pagamento || null,
      id
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Erro ao atualizar parcela' }, { status: 500 })
    }

    // Criar lançamento de receita quando parcela for paga
    if (status === 'paga') {
      const lancId = crypto.randomUUID()
      database.prepare(`
        INSERT INTO lancamentos_financeiros (
          id, user_id, tipo, descricao, valor, data_lancamento, data_pagamento, 
          status, forma_pagamento, referencia_tipo, referencia_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lancId, 
        userId, 
        'receita', 
        `Parcela ${parcela.numero_parcela} - Contrato ${parcela.contrato_id}`,
        valor_pago || parcela.valor_parcela,
        data_pagamento || toLocalDateInput(),
        data_pagamento || toLocalDateInput(),
        'pago',
        forma_pagamento || null,
        'contrato',
        parcela.contrato_id
      )
    }

    // Verificar se todas as parcelas do contrato foram pagas
    if (status === 'paga') {
      const parcelasPendentes = database.prepare(`
        SELECT COUNT(*) as count 
        FROM parcelas p
        LEFT JOIN contratos c ON p.contrato_id = c.id
        WHERE p.contrato_id = ? AND p.status != 'paga' AND c.user_id = ?
      `).get(parcela.contrato_id, userId) as { count: number }

      if (parcelasPendentes.count === 0) {
        // Marcar contrato como concluído
        database.prepare(`
          UPDATE contratos 
          SET status = 'concluido', updated_at = datetime('now')
          WHERE id = ? AND user_id = ?
        `).run(parcela.contrato_id, userId)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Parcela atualizada com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao atualizar parcela:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const database = getDb()

    const parcela = database.prepare(`
      SELECT p.id, c.user_id FROM parcelas p
      LEFT JOIN contratos c ON p.contrato_id = c.id
      WHERE p.id = ? AND c.user_id = ?
    `).get(id, userId) as any

    if (!parcela) {
      return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 })
    }

    database.prepare('DELETE FROM parcelas WHERE id = ?').run(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir parcela:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
