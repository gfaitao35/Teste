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
    const tipo = searchParams.get('tipo')
    const status = searchParams.get('status')
    const categoria_id = searchParams.get('categoria_id')
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')

    const database = getDb()

    let query = `
      SELECT l.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM lancamentos_financeiros l
      LEFT JOIN categorias_financeiras c ON l.categoria_id = c.id
      WHERE l.user_id = ?
    `
    const params: any[] = [userId]

    if (tipo) {
      query += ' AND l.tipo = ?'
      params.push(tipo)
    }
    if (status) {
      query += ' AND l.status = ?'
      params.push(status)
    }
    if (categoria_id) {
      query += ' AND l.categoria_id = ?'
      params.push(categoria_id)
    }
    if (data_inicio) {
      query += ' AND l.data_lancamento >= ?'
      params.push(data_inicio)
    }
    if (data_fim) {
      query += ' AND l.data_lancamento <= ?'
      params.push(data_fim)
    }

    query += ' ORDER BY l.data_lancamento DESC'

    const lancamentos = database.prepare(query).all(...params)
    return NextResponse.json(lancamentos)
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, categoria_id, descricao, valor, data_lancamento, data_pagamento, status, forma_pagamento, referencia_tipo, referencia_id } = body

    if (!tipo || !descricao || !valor || !data_lancamento) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const database = getDb()
    const id = crypto.randomUUID()

    database.prepare(`
      INSERT INTO lancamentos_financeiros (
        id, user_id, tipo, categoria_id, descricao, valor, data_lancamento,
        data_pagamento, status, forma_pagamento, referencia_tipo, referencia_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, tipo,
      categoria_id || null,
      descricao, valor, data_lancamento,
      data_pagamento || null,
      status || 'pendente',
      forma_pagamento || null,
      referencia_tipo || 'manual',
      referencia_id || null
    )

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar lançamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
