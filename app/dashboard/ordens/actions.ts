'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { getSessionUserId } from '@/lib/session'
import type { StatusOrdemServico } from '@/lib/types'

export async function createOrdemAction(data: {
  cliente_id: string
  data_execucao: string
  tipo_servico: string
  descricao_servico?: string | null
  local_execucao?: string | null
  equipamentos_utilizados?: string | null
  produtos_aplicados?: string | null
  area_tratada?: string | null
  pragas_alvo?: string | null
  tecnico_responsavel?: string | null
  status: StatusOrdemServico
  valor?: number | null
  observacoes?: string | null
  numero_os: string
}) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const id = generateId()
  try {
    database
      .prepare(
        `INSERT INTO ordens_servico (id, user_id, cliente_id, numero_os, data_execucao, tipo_servico, descricao_servico, local_execucao, equipamentos_utilizados, produtos_aplicados, area_tratada, pragas_alvo, observacoes, tecnico_responsavel, status, valor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        data.cliente_id,
        data.numero_os,
        data.data_execucao,
        data.tipo_servico,
        data.descricao_servico ?? null,
        data.local_execucao ?? null,
        data.equipamentos_utilizados ?? null,
        data.produtos_aplicados ?? null,
        data.area_tratada ?? null,
        data.pragas_alvo ?? null,
        data.observacoes ?? null,
        data.tecnico_responsavel ?? null,
        data.status,
        data.valor ?? null
      )
  } catch {
    return { error: 'Erro ao criar ordem de serviço' }
  }
  revalidatePath('/dashboard/ordens')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateOrdemAction(
  id: string,
  data: {
    cliente_id: string
    data_execucao: string
    tipo_servico: string
    descricao_servico?: string | null
    local_execucao?: string | null
    equipamentos_utilizados?: string | null
    produtos_aplicados?: string | null
    area_tratada?: string | null
    pragas_alvo?: string | null
    tecnico_responsavel?: string | null
    status: StatusOrdemServico
    valor?: number | null
    observacoes?: string | null
  }
) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const result = database
    .prepare(
      `UPDATE ordens_servico SET cliente_id=?, data_execucao=?, tipo_servico=?, descricao_servico=?, local_execucao=?, equipamentos_utilizados=?, produtos_aplicados=?, area_tratada=?, pragas_alvo=?, observacoes=?, tecnico_responsavel=?, status=?, valor=?, updated_at=datetime('now')
       WHERE id=? AND user_id=?`
    )
    .run(
      data.cliente_id,
      data.data_execucao,
      data.tipo_servico,
      data.descricao_servico ?? null,
      data.local_execucao ?? null,
      data.equipamentos_utilizados ?? null,
      data.produtos_aplicados ?? null,
      data.area_tratada ?? null,
      data.pragas_alvo ?? null,
      data.observacoes ?? null,
      data.tecnico_responsavel ?? null,
      data.status,
      data.valor ?? null,
      id,
      userId
    )
  if (result.changes === 0) return { error: 'Ordem não encontrada' }
  revalidatePath('/dashboard/ordens')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteOrdemAction(id: string) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const result = database.prepare('DELETE FROM ordens_servico WHERE id=? AND user_id=?').run(id, userId)
  if (result.changes === 0) return { error: 'Ordem não encontrada' }
  revalidatePath('/dashboard/ordens')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/financeiro')
  return { success: true }
}

export async function liquidarOrdemAction(
  id: string,
  data: { data_liquidacao: string; valor_pago?: number | null }
) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const result = database
    .prepare(
      'UPDATE ordens_servico SET liquidado=1, data_liquidacao=?, valor_pago=?, updated_at=datetime(\'now\') WHERE id=? AND user_id=?'
    )
    .run(data.data_liquidacao, data.valor_pago ?? null, id, userId)
  if (result.changes === 0) return { error: 'Ordem não encontrada' }
  revalidatePath('/dashboard/ordens')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function desfazerLiquidacaoAction(id: string) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const result = database
    .prepare('UPDATE ordens_servico SET liquidado=0, data_liquidacao=NULL, valor_pago=NULL, updated_at=datetime(\'now\') WHERE id=? AND user_id=?')
    .run(id, userId)
  if (result.changes === 0) return { error: 'Ordem não encontrada' }
  revalidatePath('/dashboard/ordens')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard')
  return { success: true }
}
