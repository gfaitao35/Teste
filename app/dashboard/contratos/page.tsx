import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatDateBRFromYYYYMMDD } from '@/lib/utils'

export default async function ContratosPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/auth/login')

  const database = getDb()

  const contratos = database
    .prepare(
      `SELECT c.*, cl.razao_social 
       FROM contratos c 
       LEFT JOIN clientes cl ON c.cliente_id = cl.id 
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC`
    )
    .all(userId) as (Record<string, unknown>)[]

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-800' },
      suspenso: { label: 'Suspenso', className: 'bg-amber-100 text-amber-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      concluido: { label: 'Concluído', className: 'bg-blue-100 text-blue-800' },
    }
    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  const stats = database.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
      SUM(CASE WHEN status = 'ativo' THEN valor_total ELSE 0 END) as valor_total_ativos
    FROM contratos WHERE user_id = ?
  `).get(userId) as { total: number; ativos: number; valor_total_ativos: number }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground">Gerencie os contratos de serviços</p>
        </div>
        <Link href="/dashboard/contratos/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contratos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Contratos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Ativos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Ativo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.valor_total_ativos || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Contratos ativos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <CardDescription>Contratos de serviço cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {contratos.length > 0 ? (
            <div className="space-y-4">
              {contratos.map((contrato) => {
                const statusBadge = getStatusBadge(contrato.status as string)
                return (
                  <div key={contrato.id as string} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{contrato.numero_contrato}</p>
                      <p className="text-sm text-muted-foreground">
                        {(contrato.razao_social as string) || 'Cliente não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contrato.numero_parcelas} parcelas de {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(contrato.valor_parcela as number)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateBRFromYYYYMMDD(contrato.data_inicio)} até {formatDateBRFromYYYYMMDD(contrato.data_fim)}
                      </span>
                      <Link href={`/dashboard/contratos/${contrato.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum contrato encontrado</p>
              <p className="text-sm text-muted-foreground">Comece criando um novo contrato</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
