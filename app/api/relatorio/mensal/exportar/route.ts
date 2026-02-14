// ============================================================
// VERSAO DEMO - Para o projeto real, use a versao com getDb()
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { generateMockExportData } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')

    if (!mes) {
      return NextResponse.json({ error: 'Parametro mes obrigatorio' }, { status: 400 })
    }

    const exportData = generateMockExportData(mes)
    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Erro ao exportar relatorio:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
