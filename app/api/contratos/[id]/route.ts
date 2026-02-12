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
      'SELECT id FROM contratos WHERE id = ? AND user_id = ?'
    ).get(id, userId)

    if (!existing) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    database.prepare(`
      UPDATE contratos SET
        valor_total = COALESCE(?, valor_total),
        numero_parcelas = COALESCE(?, numero_parcelas),
        valor_parcela = COALESCE(?, valor_parcela),
        dia_vencimento = COALESCE(?, dia_vencimento),
        data_inicio = COALESCE(?, data_inicio),
        data_fim = COALESCE(?, data_fim),
        status = COALESCE(?, status),
        observacoes = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      body.valor_total || null,
      body.numero_parcelas || null,
      body.valor_parcela || null,
      body.dia_vencimento || null,
      body.data_inicio || null,
      body.data_fim || null,
      body.status || null,
      body.observacoes !== undefined ? body.observacoes : null,
      id, userId
    )

    // If regenerar_parcelas flag is set, delete pending parcelas and recreate
    if (body.regenerar_parcelas) {
      database.prepare(
        "DELETE FROM parcelas WHERE contrato_id = ? AND status = 'pendente'"
      ).run(id)

      const contrato = database.prepare('SELECT * FROM contratos WHERE id = ?').get(id) as any
      const parcelasExistentes = database.prepare(
        'SELECT MAX(numero_parcela) as max_num FROM parcelas WHERE contrato_id = ?'
      ).get(id) as { max_num: number | null }

      const startNum = (parcelasExistentes.max_num || 0) + 1
      const startDate = new Date(contrato.data_inicio)

      for (let i = startNum; i <= contrato.numero_parcelas; i++) {
        const vencDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, contrato.dia_vencimento)
        database.prepare(`
          INSERT INTO parcelas (id, contrato_id, numero_parcela, valor_parcela, data_vencimento, status)
          VALUES (?, ?, ?, ?, ?, 'pendente')
        `).run(crypto.randomUUID(), id, i, contrato.valor_parcela, vencDate.toISOString().split('T')[0])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error)
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

    // Cascata: deletar parcelas primeiro
    database.prepare('DELETE FROM parcelas WHERE contrato_id = ?').run(id)
    const result = database.prepare(
      'DELETE FROM contratos WHERE id = ? AND user_id = ?'
    ).run(id, userId)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir contrato:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
