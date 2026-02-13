import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ClipboardList, CheckCircle, Award, FileText } from 'lucide-react'
import { formatDateBRFromYYYYMMDD } from '@/lib/utils'

export default async function DashboardPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/auth/login')

  const database = getDb()

  const totalClientes = (database.prepare('SELECT COUNT(*) as c FROM clientes WHERE user_id = ?').get(userId) as { c: number }).c
  const contratosEmVigor = (
  database.prepare(`
    SELECT COUNT(*) as c 
    FROM contratos 
    WHERE user_id = ?
    AND date('now') BETWEEN data_inicio AND data_fim
  `).get(userId) as { c: number }
).c

  const ordensAtivas = (database.prepare("SELECT COUNT(*) as c FROM ordens_servico WHERE user_id = ? AND status IN ('pendente', 'em_andamento')").get(userId) as { c: number }).c
  const ordensConcluidas = (database.prepare("SELECT COUNT(*) as c FROM ordens_servico WHERE user_id = ? AND status = 'concluida'").get(userId) as { c: number }).c
  const certificadosEmitidos = (database.prepare('SELECT COUNT(*) as c FROM certificados WHERE user_id = ?').get(userId) as { c: number }).c

  const ordensRecentesRows = database
    .prepare(
      `SELECT o.*, c.razao_social 
       FROM ordens_servico o 
       LEFT JOIN clientes c ON o.cliente_id = c.id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC 
       LIMIT 5`
    )
    .all(userId) as (Record<string, unknown>)[]

  const stats = [
    {
      title: 'Total de Clientes',
      value: totalClientes,
      description: 'Clientes cadastrados',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Contratos em Vigor',
      value: contratosEmVigor,
      description: 'Contratos ativos atualmente',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Ordens Ativas',
      value: ordensAtivas,
      description: 'Pendentes ou em andamento',
      icon: ClipboardList,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Ordens Concluídas',
      value: ordensConcluidas,
      description: 'Serviços finalizados',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Certificados Emitidos',
      value: certificadosEmitidos,
      description: 'Certificados gerados',
      icon: Award,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800' },
      concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800' },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
    }
    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <CardDescription>Últimas ordens de serviço registradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {ordensRecentesRows.length > 0 ? (
            <div className="space-y-4">
              {ordensRecentesRows.map((ordem) => {
                const statusBadge = getStatusBadge(ordem.status as string)
                return (
                  <div key={ordem.id as string} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{ordem.numero_os}</p>
                      <p className="text-sm text-muted-foreground">
                        {(ordem.razao_social as string) || 'Cliente não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">{ordem.tipo_servico}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateBRFromYYYYMMDD(ordem.data_execucao as string)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardList className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
              <p className="text-sm text-muted-foreground">Comece criando uma nova ordem de serviço</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
