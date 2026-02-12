import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, DollarSign, Users, FileText } from 'lucide-react'

export default async function RelatorioMensalPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/auth/login')

  const database = getDb()

  // Data atual e mês anterior
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1).toISOString().slice(0, 7)

  // Estatísticas do mês atual
  const statsCurrentMonth = database.prepare(`
    SELECT 
      COUNT(*) as total_os,
      COUNT(CASE WHEN status = 'concluida' THEN 1 END) as os_concluidas,
      SUM(CASE WHEN status = 'concluida' THEN valor ELSE 0 END) as valor_total,
      SUM(CASE WHEN liquidado = 1 THEN valor_pago ELSE 0 END) as valor_liquidado,
      COUNT(DISTINCT cliente_id) as clientes_atendidos
    FROM ordens_servico 
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
  `).get(userId, currentMonth) as {
    total_os: number
    os_concluidas: number
    valor_total: number
    valor_liquidado: number
    clientes_atendidos: number
  }

  // Estatísticas do mês anterior
  const statsLastMonth = database.prepare(`
    SELECT 
      COUNT(*) as total_os,
      COUNT(CASE WHEN status = 'concluida' THEN 1 END) as os_concluidas,
      SUM(CASE WHEN status = 'concluida' THEN valor ELSE 0 END) as valor_total,
      SUM(CASE WHEN liquidado = 1 THEN valor_pago ELSE 0 END) as valor_liquidado,
      COUNT(DISTINCT cliente_id) as clientes_atendidos
    FROM ordens_servico 
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
  `).get(userId, lastMonth) as {
    total_os: number
    os_concluidas: number
    valor_total: number
    valor_liquidado: number
    clientes_atendidos: number
  }

  // Serviços por tipo no mês atual
  const servicosPorTipo = database.prepare(`
    SELECT 
      tipo_servico,
      COUNT(*) as quantidade,
      SUM(valor) as valor_total
    FROM ordens_servico 
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = ? AND status = 'concluida'
    GROUP BY tipo_servico
    ORDER BY quantidade DESC
  `).all(userId, currentMonth) as {
    tipo_servico: string
    quantidade: number
    valor_total: number
  }[]

  // Top clientes do mês
  const topClientes = database.prepare(`
    SELECT 
      c.razao_social,
      COUNT(o.id) as quantidade_os,
      SUM(o.valor) as valor_total
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.user_id = ? AND strftime('%Y-%m', o.created_at) = ? AND o.status = 'concluida'
    GROUP BY o.cliente_id, c.razao_social
    ORDER BY valor_total DESC
    LIMIT 10
  `).all(userId, currentMonth) as {
    razao_social: string
    quantidade_os: number
    valor_total: number
  }[]

  // Ordens recentes do mês
  const ordensRecentes = database.prepare(`
    SELECT 
      o.numero_os,
      c.razao_social,
      o.tipo_servico,
      o.valor,
      o.status,
      o.created_at
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.user_id = ? AND strftime('%Y-%m', o.created_at) = ?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(userId, currentMonth) as {
    numero_os: string
    razao_social: string
    tipo_servico: string
    valor: number
    status: string
    created_at: string
  }[]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800' },
      concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800' },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
    }
    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório Mensal</h1>
        <p className="text-muted-foreground">Visão detalhada do desempenho de {monthName}</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de OS
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsCurrentMonth.total_os}</div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(statsCurrentMonth.total_os, statsLastMonth.total_os)} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OS Concluídas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsCurrentMonth.os_concluidas}</div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(statsCurrentMonth.os_concluidas, statsLastMonth.os_concluidas)} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(statsCurrentMonth.valor_total)}</div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(statsCurrentMonth.valor_total, statsLastMonth.valor_total)} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(statsCurrentMonth.valor_liquidado)}</div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(statsCurrentMonth.valor_liquidado, statsLastMonth.valor_liquidado)} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Atendidos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsCurrentMonth.clientes_atendidos}</div>
            <p className="text-xs text-muted-foreground">
              {getPercentageChange(statsCurrentMonth.clientes_atendidos, statsLastMonth.clientes_atendidos)} vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Serviços por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços por Tipo</CardTitle>
            <CardDescription>Distribuição dos serviços realizados no mês</CardDescription>
          </CardHeader>
          <CardContent>
            {servicosPorTipo.length > 0 ? (
              <div className="space-y-4">
                {servicosPorTipo.map((servico) => (
                  <div key={servico.tipo_servico} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{servico.tipo_servico}</p>
                      <p className="text-sm text-muted-foreground">{servico.quantidade} serviços</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(servico.valor_total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(servico.valor_total / servico.quantidade)} por serviço
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhum serviço concluído este mês</p>
            )}
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clientes do Mês</CardTitle>
            <CardDescription>Clientes que mais geraram receita</CardDescription>
          </CardHeader>
          <CardContent>
            {topClientes.length > 0 ? (
              <div className="space-y-4">
                {topClientes.map((cliente, index) => (
                  <div key={cliente.razao_social} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{cliente.razao_social}</p>
                        <p className="text-sm text-muted-foreground">{cliente.quantidade_os} serviços</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(cliente.valor_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhum cliente atendido este mês</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ordens Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <CardDescription>Últimas ordens registradas este mês</CardDescription>
        </CardHeader>
        <CardContent>
          {ordensRecentes.length > 0 ? (
            <div className="space-y-4">
              {ordensRecentes.map((ordem) => {
                const statusBadge = getStatusBadge(ordem.status)
                return (
                  <div key={ordem.numero_os} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{ordem.numero_os}</p>
                      <p className="text-sm text-muted-foreground">{ordem.razao_social}</p>
                      <p className="text-xs text-muted-foreground">{ordem.tipo_servico}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(ordem.valor)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada este mês</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
