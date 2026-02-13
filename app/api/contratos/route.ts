import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { toLocalDateInput } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const database = getDb()
    const contratos = database
      .prepare(
        `SELECT c.*, cl.razao_social 
         FROM contratos c 
         LEFT JOIN clientes cl ON c.cliente_id = cl.id 
         WHERE c.user_id = ? 
         ORDER BY c.created_at DESC`
      )
      .all(userId)

    return NextResponse.json(contratos)
  } catch (error) {
    console.error('Erro ao buscar contratos:', error)
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
    const {
      cliente_id,
      data_inicio,
      data_fim,
      valor_total,
      numero_parcelas,
      valor_parcela,
      dia_vencimento,
      observacoes
    } = body

    if (!cliente_id || !data_inicio || !data_fim || !valor_total || !numero_parcelas || !dia_vencimento) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const database = getDb()

    // Gerar número do contrato
    const lastContrato = database.prepare('SELECT numero_contrato FROM contratos ORDER BY created_at DESC LIMIT 1').get() as { numero_contrato: string } | undefined
    const nextNumber = lastContrato ? parseInt(lastContrato.numero_contrato.replace(/\D/g, '')) + 1 : 1
    const numero_contrato = `CTR${String(nextNumber).padStart(6, '0')}`

    // Inserir contrato
    const contratoId = crypto.randomUUID()
    database.prepare(`
      INSERT INTO contratos (
        id, user_id, cliente_id, numero_contrato, data_inicio, data_fim,
        valor_total, numero_parcelas, valor_parcela, dia_vencimento, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contratoId, userId, cliente_id, numero_contrato, data_inicio, data_fim,
      valor_total, numero_parcelas, valor_parcela, dia_vencimento, observacoes
    )

    // Gerar parcelas
    const startDate = new Date(data_inicio)
    for (let i = 1; i <= numero_parcelas; i++) {
      const vencimentoDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, dia_vencimento)
      const data_vencimento = toLocalDateInput(vencimentoDate)

      database.prepare(`
        INSERT INTO parcelas (
          id, contrato_id, numero_parcela, valor_parcela, data_vencimento, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(), contratoId, i, valor_parcela, data_vencimento, 'pendente'
      )
    }

    return NextResponse.json({ 
      id: contratoId, 
      numero_contrato,
      message: 'Contrato criado com sucesso' 
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar contrato:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
