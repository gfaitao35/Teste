import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

const DEFAULT_CATEGORIAS = [
  { nome: 'Servico Avulso', tipo: 'receita', cor: '#22c55e' },
  { nome: 'Contrato Mensal', tipo: 'receita', cor: '#3b82f6' },
  { nome: 'Material/Insumos', tipo: 'despesa', cor: '#ef4444' },
  { nome: 'Combustivel', tipo: 'despesa', cor: '#f97316' },
  { nome: 'Aluguel', tipo: 'despesa', cor: '#8b5cf6' },
  { nome: 'Salarios', tipo: 'despesa', cor: '#ec4899' },
  { nome: 'Manutencao', tipo: 'despesa', cor: '#14b8a6' },
  { nome: 'Outros', tipo: 'despesa', cor: '#6b7280' },
]

function ensureDefaultCategorias(database: any, userId: string) {
  const count = database.prepare(
    'SELECT COUNT(*) as count FROM categorias_financeiras WHERE user_id = ?'
  ).get(userId) as { count: number }

  if (count.count === 0) {
    const insert = database.prepare(
      'INSERT INTO categorias_financeiras (id, user_id, nome, tipo, cor) VALUES (?, ?, ?, ?, ?)'
    )
    for (const cat of DEFAULT_CATEGORIAS) {
      insert.run(crypto.randomUUID(), userId, cat.nome, cat.tipo, cat.cor)
    }
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const database = getDb()
    ensureDefaultCategorias(database, userId)

    const categorias = database.prepare(
      'SELECT * FROM categorias_financeiras WHERE user_id = ? ORDER BY tipo, nome'
    ).all(userId)

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
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
    const { nome, tipo, cor } = body

    if (!nome || !tipo) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    const database = getDb()
    const id = crypto.randomUUID()

    database.prepare(
      'INSERT INTO categorias_financeiras (id, user_id, nome, tipo, cor) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, nome, tipo, cor || '#6b7280')

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
