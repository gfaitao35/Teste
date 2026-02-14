// ============================================================
// VERSAO DEMO - Para o projeto real, use a versao com getDb()
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { generateMockReport } from '@/lib/mock-data'
import { metasStore } from '@/lib/meta-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')

    const now = new Date()
    const currentMonth = mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const report = generateMockReport(currentMonth)

    // Adicionar meta se existir
    const meta = metasStore.get(currentMonth)
    if (meta) {
      report.meta = { id: `meta-${currentMonth}`, ...meta }
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Erro ao buscar relatorio mensal:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
