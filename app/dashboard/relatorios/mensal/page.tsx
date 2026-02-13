import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import { FileText, TrendingUp, DollarSign, Users } from 'lucide-react'
import { formatDateBRFromYYYYMMDD } from '@/lib/utils'

type Stats = {
  total_os: number
  os_concluidas: number
  valor_total: number
  valor_liquidado: number
  clientes_atendidos: number
}

export default async function RelatorioMensalPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/auth/login')

  const database = getDb()

  // ======================
  // DATAS
  // ======================
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    .toISOString()
    .slice(0, 7)

  // ======================
  // FUNÇÕES AUXILIARES
  // ======================
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800' },
      concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800' },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800' }
    }
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  // ======================
  // QUERIES
  // ======================
  const statsQuery = `
    SELECT 
      COUNT(*) as total_os,
      COUNT(CASE WHEN status='concluida' THEN 1 END) as os_concluidas,
      SUM(CASE WHEN status='concluida' THEN valor ELSE 0 END) as valor_total,
      SUM(CASE WHEN liquidado=1 THEN valor_pago ELSE 0 END) as valor_liquidado,
      COUNT(DISTINCT cliente_id) as clientes_atendidos
    FROM ordens_servico
    WHERE user_id=? AND strftime('%Y-%m', created_at)=?
  `

  const statsCurrentMonth = database.prepare(statsQuery).get(userId, currentMonth) as Stats
  const statsLastMonth = database.prepare(statsQuery).get(userId, lastMonth) as Stats

  const servicosPorTipo = database.prepare(`
    SELECT tipo_servico, COUNT(*) as quantidade, SUM(valor) as valor_total
    FROM ordens_servico
    WHERE user_id=? AND strftime('%Y-%m', created_at)=? AND status='concluida'
    GROUP BY tipo_servico
    ORDER BY quantidade DESC
  `).all(userId, currentMonth)

  const topClientes = database.prepare(`
    SELECT c.razao_social, COUNT(o.id) as quantidade_os, SUM(o.valor) as valor_total
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.user_id=? AND strftime('%Y-%m', o.created_at)=? AND o.status='concluida'
    GROUP BY o.cliente_id, c.razao_social
    ORDER BY valor_total DESC
    LIMIT 10
  `).all(userId, currentMonth)

  const ordensRecentes = database.prepare(`
    SELECT o.numero_os, c.razao_social, o.tipo_servico, o.valor, o.status, o.created_at
    FROM ordens_servico o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.user_id=? AND strftime('%Y-%m', o.created_at)=?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(userId, currentMonth)

  const monthName = now.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })

  // ======================
  // JSX
  // ======================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Relatório Mensal</h1>
        <p className="text-muted-foreground">
          Visão detalhada do desempenho de {monthName}
        </p>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total OS" icon={<FileText />} value={statsCurrentMonth.total_os}
          change={getPercentageChange(statsCurrentMonth.total_os, statsLastMonth.total_os)} />

        <StatCard title="OS Concluídas" icon={<TrendingUp />} value={statsCurrentMonth.os_concluidas}
          change={getPercentageChange(statsCurrentMonth.os_concluidas, statsLastMonth.os_concluidas)} />

        <StatCard title="Faturamento" icon={<DollarSign />} value={formatCurrency(statsCurrentMonth.valor_total)}
          change={getPercentageChange(statsCurrentMonth.valor_total, statsLastMonth.valor_total)} />

        <StatCard title="Recebido" icon={<DollarSign />} value={formatCurrency(statsCurrentMonth.valor_liquidado)}
          change={getPercentageChange(statsCurrentMonth.valor_liquidado, statsLastMonth.valor_liquidado)} />

        <StatCard title="Clientes" icon={<Users />} value={statsCurrentMonth.clientes_atendidos}
          change={getPercentageChange(statsCurrentMonth.clientes_atendidos, statsLastMonth.clientes_atendidos)} />
      </div>

      {/* SERVIÇOS / CLIENTES */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Serviços por Tipo</CardTitle>
            <CardDescription>Distribuição dos serviços realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {servicosPorTipo.map((s: any) => (
              <div key={s.tipo_servico} className="flex justify-between">
                <span>{s.tipo_servico}</span>
                <span>{formatCurrency(s.valor_total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <CardDescription>Quem mais gerou receita</CardDescription>
          </CardHeader>
          <CardContent>
            {topClientes.map((c: any, i: number) => (
              <div key={c.razao_social} className="flex justify-between">
                <span>{i + 1}. {c.razao_social}</span>
                <span>{formatCurrency(c.valor_total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ORDENS RECENTES */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens Recentes</CardTitle>
          <CardDescription>Últimas ordens do mês</CardDescription>
        </CardHeader>
        <CardContent>
          {ordensRecentes.map((o: any) => {
            const badge = getStatusBadge(o.status)
            return (
              <div key={o.numero_os} className="flex justify-between border p-3 rounded">
                <div>
                  <p className="font-medium">{o.numero_os}</p>
                  <p className="text-sm">{o.razao_social}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${badge.className}`}>
                    {badge.label}
                  </span>
                  <p>{formatCurrency(o.valor)}</p>
                  <p className="text-xs">{formatDateBRFromYYYYMMDD(o.created_at)}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

/* ======================
   COMPONENTE AUXILIAR
====================== */
function StatCard({
  title,
  icon,
  value,
  change
}: {
  title: string
  icon: React.ReactNode
  value: any
  change: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change} vs mês anterior</p>
      </CardContent>
    </Card>
  )
}
