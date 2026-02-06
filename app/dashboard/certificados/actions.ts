'use server'

import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { getSessionUserId } from '@/lib/session'

export async function createCertificadoAction(data: {
  ordem_servico_id: string
  numero_certificado: string
  data_emissao: string
  data_validade: string
  tipo_certificado: string
  observacoes?: string | null
}) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const id = generateId()
  try {
    database
      .prepare(
        `INSERT INTO certificados (id, user_id, ordem_servico_id, numero_certificado, data_emissao, data_validade, tipo_certificado, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        data.ordem_servico_id,
        data.numero_certificado,
        data.data_emissao,
        data.data_validade,
        data.tipo_certificado,
        data.observacoes ?? null
      )
  } catch {
    return { error: 'Erro ao gerar certificado' }
  }
  revalidatePath('/dashboard/certificados')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCertificadoAction(id: string) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Usuário não autenticado' }

  const database = getDb()
  const result = database.prepare('DELETE FROM certificados WHERE id=? AND user_id=?').run(id, userId)
  if (result.changes === 0) return { error: 'Certificado não encontrado' }
  revalidatePath('/dashboard/certificados')
  revalidatePath('/dashboard')
  return { success: true }
}
