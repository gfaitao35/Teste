// ============================================================
// VERSAO DEMO - Para o projeto real, use a versao com getDb()
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { metasStore } from '@/lib/meta-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')

    if (!mes) {
      return NextResponse.json({ error: 'Parametro mes obrigatorio' }, { status: 400 })
    }

    const meta = metasStore.get(mes)
    return NextResponse.json(meta ? { id: `meta-${mes}`, ...meta } : null)
  } catch (error) {
    console.error('Erro ao buscar meta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mes, valor_meta, observacoes } = body

    if (!mes || valor_meta === undefined || valor_meta === null) {
      return NextResponse.json({ error: 'Campos obrigatorios: mes, valor_meta' }, { status: 400 })
    }

    metasStore.set(mes, { valor_meta, observacoes: observacoes || '' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar meta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
