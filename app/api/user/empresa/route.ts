import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = getDb()

    const user = db.prepare(`
      SELECT 
        nome_fantasia    AS nomeFantasia,
        razao_social     AS razaoSocial,
        cnpj,
        email,
        nome_completo    AS nomeCompleto
      FROM users 
      WHERE id = ?
    `).get(userId) as any

    if (!user) {
      return NextResponse.json({ error: 'Dados não encontrados' }, { status: 404 })
    }

    return NextResponse.json({
      nomeFantasia: user.nomeFantasia || '',
      razaoSocial: user.razaoSocial || '',
      cnpj: user.cnpj || '',
      email: user.email || '',
      nomeCompleto: user.nomeCompleto || '',
    })
  } catch (error) {
    console.error('[API /user/empresa] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}