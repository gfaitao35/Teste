import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const database = getDb()

    const existing = database.prepare(
      'SELECT id FROM lancamentos_financeiros WHERE id = ? AND user_id = ?'
    ).get(id, userId)

    if (!existing) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    database.prepare(`
      UPDATE lancamentos_financeiros SET
        tipo = COALESCE(?, tipo),
        categoria_id = ?,
        descricao = COALESCE(?, descricao),
        valor = COALESCE(?, valor),
        data_lancamento = COALESCE(?, data_lancamento),
        data_pagamento = ?,
        status = COALESCE(?, status),
        forma_pagamento = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      body.tipo || null,
      body.categoria_id !== undefined ? body.categoria_id : null,
      body.descricao || null,
      body.valor || null,
      body.data_lancamento || null,
      body.data_pagamento || null,
      body.status || null,
      body.forma_pagamento || null,
      id, userId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error)
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

    const result = database.prepare(
      'DELETE FROM lancamentos_financeiros WHERE id = ? AND user_id = ?'
    ).run(id, userId)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
