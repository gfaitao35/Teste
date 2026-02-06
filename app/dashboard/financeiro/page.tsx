import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
import { FinanceiroTable } from '@/components/financeiro/financeiro-table'
import type { OrdemServico, Cliente } from '@/lib/types'

function rowToCliente(row: Record<string, unknown>): Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'> {
  return {
    id: row.id as string,
    razao_social: row.razao_social as string,
    nome_fantasia: (row.nome_fantasia as string) || null,
  }
}

function rowToOrdem(row: Record<string, unknown>, cliente?: Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'>): OrdemServico {
  return {
    id: row.id as string,
    numero_os: row.numero_os as string,
    cliente_id: row.cliente_id as string,
    data_execucao: row.data_execucao as string,
    tipo_servico: row.tipo_servico as string,
    descricao_servico: (row.descricao_servico as string) || null,
    local_execucao: (row.local_execucao as string) || null,
    equipamentos_utilizados: (row.equipamentos_utilizados as string) || null,
    produtos_aplicados: (row.produtos_aplicados as string) || null,
    area_tratada: (row.area_tratada as string) || null,
    pragas_alvo: (row.pragas_alvo as string) || null,
    observacoes: (row.observacoes as string) || null,
    tecnico_responsavel: (row.tecnico_responsavel as string) || null,
    status: row.status as OrdemServico['status'],
    valor: (row.valor as number) ?? null,
    liquidado: (row.liquidado as number) === 1,
    data_liquidacao: (row.data_liquidacao as string) || null,
    valor_pago: (row.valor_pago as number) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_id: row.user_id as string,
    cliente: cliente ?? undefined,
  }
}

export default async function FinanceiroPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/auth/login')

  const database = getDb()
  const ordensRows = database
    .prepare('SELECT * FROM ordens_servico WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Record<string, unknown>[]
  const clientesRows = database
    .prepare('SELECT id, razao_social, nome_fantasia FROM clientes WHERE user_id = ?')
    .all(userId) as Record<string, unknown>[]

  const clientesMap = new Map<string, Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'>>()
  for (const r of clientesRows) {
    clientesMap.set(r.id as string, rowToCliente(r))
  }
  const ordens = ordensRows.map((r) => rowToOrdem(r, clientesMap.get(r.cliente_id as string)))

  const totalPendente = ordens.filter((o) => !o.liquidado && o.valor).reduce((s, o) => s + (o.valor ?? 0), 0)
  const totalLiquidado = ordens.filter((o) => o.liquidado).reduce((s, o) => s + (o.valor_pago ?? o.valor ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">
          Liquide as ordens de serviço (contratos). Marque como pago quando o cliente quitar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">A receber (pendentes)</p>
          <p className="text-2xl font-bold text-amber-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Recebido (liquidado)</p>
          <p className="text-2xl font-bold text-emerald-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalLiquidado)}
          </p>
        </div>
      </div>

      <FinanceiroTable ordens={ordens} />
    </div>
  )
}
