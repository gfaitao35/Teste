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

    // Buscar certificado com dados da ordem de serviço
    const certificado = database.prepare(`
      SELECT c.*, 
             o.numero_os as os_numero,
             o.tipo_servico as os_tipo_servico,
             o.data_execucao as os_data_execucao,
             cl.razao_social as cliente_razao_social,
             cl.nome_fantasia as cliente_nome_fantasia
      FROM certificados c
      LEFT JOIN ordens_servico o ON c.ordem_servico_id = o.id
      LEFT JOIN clientes cl ON o.cliente_id = cl.id
      WHERE c.id = ? AND c.user_id = ?
    `).get(params.id, userId) as any

    if (!certificado) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
    }

    // Estruturar os dados para o frontend
    const certificadoFormatado = {
      id: certificado.id,
      numero_certificado: certificado.numero_certificado,
      ordem_servico_id: certificado.ordem_servico_id,
      ordem_servico: {
        numero_os: certificado.os_numero,
        cliente: {
          razao_social: certificado.cliente_razao_social,
          nome_fantasia: certificado.cliente_nome_fantasia
        },
        tipo_servico: certificado.os_tipo_servico,
        data_execucao: certificado.os_data_execucao
      },
      data_emissao: certificado.data_emissao,
      data_validade: certificado.data_validade,
      tipo_certificado: certificado.tipo_certificado,
      observacoes: certificado.observacoes,
      created_at: certificado.created_at
    }

    return NextResponse.json(certificadoFormatado)

  } catch (error) {
    console.error('Erro ao buscar certificado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
