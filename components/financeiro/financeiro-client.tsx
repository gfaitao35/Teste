'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FinanceiroTable } from './financeiro-table'
import { BaixaParcelaDialog } from './baixa-parcela-dialog'
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle, MoreHorizontal, Plus, Trash2, CheckCircle, Clock, AlertTriangle, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import type { OrdemServico } from '@/lib/types'
import Link from 'next/link'

interface FinanceiroClientProps {
  ordens: OrdemServico[]
  contratos: any[]
  parcelas: any[]
}

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CHART_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280']

export function FinanceiroClient({ ordens, contratos, parcelas }: FinanceiroClientProps) {
  const router = useRouter()
  const [resumo, setResumo] = useState<any>(null)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [showNovoLancamento, setShowNovoLancamento] = useState(false)
  const [novoLanc, setNovoLanc] = useState({ tipo: 'despesa', categoria_id: '', descricao: '', valor: '', data_lancamento: new Date().toISOString().split('T')[0], data_pagamento: '', status: 'pendente', forma_pagamento: '' })
  const [saving, setSaving] = useState(false)
  const [periodo, setPeriodo] = useState('mes_atual')

  useEffect(() => {
    fetchResumo()
    fetchLancamentos()
    fetchCategorias()
  }, [periodo])

  const getPeriodoDates = () => {
    const now = new Date()
    if (periodo === 'mes_atual') return { data_inicio: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, data_fim: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31` }
    if (periodo === 'mes_anterior') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { data_inicio: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`, data_fim: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-31` }
    }
    if (periodo === '3_meses') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return { data_inicio: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`, data_fim: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31` }
    }
    return {}
  }

  const fetchResumo = async () => {
    try {
      const d = getPeriodoDates()
      const q = new URLSearchParams()
      if (d.data_inicio) q.set('data_inicio', d.data_inicio)
      if (d.data_fim) q.set('data_fim', d.data_fim)
      const res = await fetch(`/api/financeiro/resumo?${q}`)
      if (res.ok) setResumo(await res.json())
    } catch {}
  }

  const fetchLancamentos = async () => {
    try {
      const d = getPeriodoDates()
      const q = new URLSearchParams()
      if (d.data_inicio) q.set('data_inicio', d.data_inicio)
      if (d.data_fim) q.set('data_fim', d.data_fim)
      const res = await fetch(`/api/lancamentos?${q}`)
      if (res.ok) setLancamentos(await res.json())
    } catch {}
  }

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias')
      if (res.ok) setCategorias(await res.json())
    } catch {}
  }

  const handleNovoLancamento = async () => {
    if (!novoLanc.descricao || !novoLanc.valor) { toast.error('Preencha descricao e valor'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novoLanc, valor: parseFloat(novoLanc.valor), referencia_tipo: 'manual' })
      })
      if (res.ok) {
        toast.success('Lancamento criado!')
        setShowNovoLancamento(false)
        setNovoLanc({ tipo: 'despesa', categoria_id: '', descricao: '', valor: '', data_lancamento: new Date().toISOString().split('T')[0], data_pagamento: '', status: 'pendente', forma_pagamento: '' })
        fetchLancamentos()
        fetchResumo()
      } else toast.error('Erro ao criar lancamento')
    } catch { toast.error('Erro ao criar lancamento') }
    finally { setSaving(false) }
  }

  const handleDeleteLancamento = async (id: string) => {
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Lancamento excluido!'); fetchLancamentos(); fetchResumo() }
    } catch { toast.error('Erro ao excluir') }
  }

  const handlePagarLancamento = async (lanc: any) => {
    try {
      const res = await fetch(`/api/lancamentos/${lanc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
      })
      if (res.ok) { toast.success('Lancamento pago!'); fetchLancamentos(); fetchResumo() }
    } catch { toast.error('Erro ao pagar') }
  }

  // Computed
  const osPendentes = ordens.filter(o => !o.liquidado && o.status !== 'cancelada')
  const parcelasPendentes = parcelas.filter((p: any) => p.status === 'pendente' || p.status === 'atrasada')
  const contasReceber = [
    ...osPendentes.map(o => ({ id: o.id, tipo: 'OS', referencia: o.numero_os, cliente: (o.cliente as any)?.razao_social || '-', valor: o.valor || 0, vencimento: o.data_execucao, status: 'pendente' as string, source: 'os' as const })),
    ...parcelasPendentes.map((p: any) => ({ id: p.id, tipo: 'Parcela', referencia: `${p.numero_contrato} - P${p.numero_parcela}`, cliente: p.cliente_razao_social || '-', valor: p.valor_parcela, vencimento: p.data_vencimento, status: p.status, source: 'parcela' as const }))
  ].sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())

  const despesasPendentes = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pendente')
  const despesasPagas = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pago')

  // Charts data
  const chartMensal = resumo?.chart_mensal || []
  const chartDataFormatted = chartMensal.map((d: any) => {
    const [y, m] = d.mes.split('-')
    return { mes: `${MESES[parseInt(m) - 1]}/${y.slice(2)}`, receitas: d.receitas || 0, despesas: d.despesas || 0 }
  })

  const despCategoria = resumo?.despesas_por_categoria || []

  // DRE
  const totalReceitaOS = ordens.filter(o => o.liquidado).reduce((s, o) => s + (o.valor_pago || o.valor || 0), 0)
  const totalReceitaParcelas = parcelas.filter((p: any) => p.status === 'paga').reduce((s: number, p: any) => s + (p.valor_pago || p.valor_parcela), 0)
  const totalReceitaLanc = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  const receitaBruta = totalReceitaOS + totalReceitaParcelas + totalReceitaLanc
  const despesasPorCat = categorias.filter(c => c.tipo === 'despesa').map(c => ({
    ...c,
    total: lancamentos.filter(l => l.categoria_id === c.id && l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  })).filter(c => c.total > 0)
  const totalDespesas = despesasPorCat.reduce((s, c) => s + c.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Gestao financeira completa do seu negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mes Atual</SelectItem>
              <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
              <SelectItem value="3_meses">Ultimos 3 Meses</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNovoLancamento(true)}><Plus className="mr-2 h-4 w-4" />Novo Lancamento</Button>
        </div>
      </div>

      <Tabs defaultValue="visao_geral">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visao_geral">Visao Geral</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="lancamentos">Lancamentos</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        {/* VISAO GERAL */}
        <TabsContent value="visao_geral" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Receita</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold text-emerald-600">{formatCurrency(resumo?.receita_total || 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Despesa</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold text-red-600">{formatCurrency(resumo?.despesa_total || 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Lucro</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><div className={`text-xl font-bold ${(resumo?.lucro_liquido || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(resumo?.lucro_liquido || 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">A Receber</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold text-amber-600">{formatCurrency(resumo?.a_receber || 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">A Pagar</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent><div className="text-xl font-bold text-orange-600">{formatCurrency(resumo?.a_pagar || 0)}</div></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Receitas vs Despesas (6 meses)</CardTitle></CardHeader>
              <CardContent>
                {chartDataFormatted.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartDataFormatted}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">Sem dados para exibir</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {despCategoria.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={240}>
                      <PieChart>
                        <Pie data={despCategoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label={false}>
                          {despCategoria.map((d: any, i: number) => <Cell key={i} fill={d.cor || CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {despCategoria.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.cor || CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span>{d.categoria}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(d.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground">Sem despesas registradas</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTAS A RECEBER */}
        <TabsContent value="receber" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">OS Pendentes</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-amber-600">{formatCurrency(osPendentes.reduce((s, o) => s + (o.valor || 0), 0))}</div><p className="text-xs text-muted-foreground">{osPendentes.length} ordens</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Parcelas Pendentes</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(parcelasPendentes.reduce((s: number, p: any) => s + p.valor_parcela, 0))}</div><p className="text-xs text-muted-foreground">{parcelasPendentes.length} parcelas</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total a Receber</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(contasReceber.reduce((s, c) => s + c.valor, 0))}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Contas a Receber</CardTitle><CardDescription>OS pendentes e parcelas de contratos</CardDescription></CardHeader>
            <CardContent>
              {contasReceber.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasReceber.map((item) => {
                        const vencida = new Date(item.vencimento) < new Date() && item.status !== 'paga'
                        return (
                          <TableRow key={`${item.source}-${item.id}`} className={vencida ? 'bg-red-50/50' : ''}>
                            <TableCell><Badge variant="outline">{item.tipo}</Badge></TableCell>
                            <TableCell className="font-mono text-sm">{item.referencia}</TableCell>
                            <TableCell>{item.cliente}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.valor)}</TableCell>
                            <TableCell className={vencida ? 'text-red-600 font-medium' : ''}>{formatDate(item.vencimento)}</TableCell>
                            <TableCell>
                              {vencida ? <Badge variant="destructive">Vencida</Badge> : <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>}
                            </TableCell>
                            <TableCell>
                              {item.source === 'os' ? (
                                <Link href="/dashboard/ordens"><Button variant="ghost" size="sm">Ver OS</Button></Link>
                              ) : (
                                <Link href={`/dashboard/contratos`}><Button variant="ghost" size="sm">Ver Contrato</Button></Link>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="mb-4 h-12 w-12 text-emerald-300" />
                  <p className="text-muted-foreground">Nenhuma conta a receber pendente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTAS A PAGAR */}
        <TabsContent value="pagar" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Despesas Pendentes</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(despesasPendentes.reduce((s, l) => s + l.valor, 0))}</div><p className="text-xs text-muted-foreground">{despesasPendentes.length} lancamentos</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Despesas Pagas (periodo)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(despesasPagas.reduce((s, l) => s + l.valor, 0))}</div><p className="text-xs text-muted-foreground">{despesasPagas.length} lancamentos</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Despesas</CardTitle><CardDescription>Gerencie suas despesas e contas a pagar</CardDescription></div>
                <Button size="sm" onClick={() => { setNovoLanc(p => ({ ...p, tipo: 'despesa' })); setShowNovoLancamento(true) }}><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
              </div>
            </CardHeader>
            <CardContent>
              {lancamentos.filter(l => l.tipo === 'despesa').length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lancamentos.filter(l => l.tipo === 'despesa').map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.descricao}</TableCell>
                          <TableCell>
                            {l.categoria_nome ? (
                              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.categoria_cor || '#6b7280' }} /><span className="text-sm">{l.categoria_nome}</span></div>
                            ) : <span className="text-muted-foreground text-sm">Sem categoria</span>}
                          </TableCell>
                          <TableCell className="font-medium text-red-600">{formatCurrency(l.valor)}</TableCell>
                          <TableCell>{formatDate(l.data_lancamento)}</TableCell>
                          <TableCell>
                            <Badge className={l.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                              {l.status === 'pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {l.status === 'pendente' && <DropdownMenuItem onClick={() => handlePagarLancamento(l)}><DollarSign className="mr-2 h-4 w-4" />Marcar como Pago</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => handleDeleteLancamento(l.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Nenhuma despesa registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LANCAMENTOS (Extrato) */}
        <TabsContent value="lancamentos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Extrato de Lancamentos</CardTitle><CardDescription>Historico completo de receitas e despesas manuais</CardDescription></div>
                <Button size="sm" onClick={() => setShowNovoLancamento(true)}><Plus className="mr-2 h-4 w-4" />Novo Lancamento</Button>
              </div>
            </CardHeader>
            <CardContent>
              {lancamentos.length > 0 ? (
                <div className="space-y-2">
                  {lancamentos.map(l => (
                    <div key={l.id} className={`flex items-center justify-between rounded-lg border p-3 ${l.tipo === 'receita' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'}`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {l.tipo === 'receita' ? <ArrowDownCircle className="h-4 w-4 text-emerald-500" /> : <ArrowUpCircle className="h-4 w-4 text-red-500" />}
                          <span className="font-medium text-sm">{l.descricao}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(l.data_lancamento)}</span>
                          {l.categoria_nome && <span>{l.categoria_nome}</span>}
                          {l.forma_pagamento && <span>{l.forma_pagamento}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`font-semibold ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {l.tipo === 'receita' ? '+' : '-'}{formatCurrency(l.valor)}
                          </span>
                        </div>
                        <Badge className={l.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                          {l.status === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {l.status === 'pendente' && <DropdownMenuItem onClick={() => handlePagarLancamento(l)}><DollarSign className="mr-2 h-4 w-4" />Marcar como Pago</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => handleDeleteLancamento(l.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Nenhum lancamento encontrado no periodo</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowNovoLancamento(true)}>Criar Lancamento</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keep existing OS table */}
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Servico</CardTitle>
              <CardDescription>Liquidacao de OS avulsas</CardDescription>
            </CardHeader>
            <CardContent>
              <FinanceiroTable ordens={ordens} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DRE */}
        <TabsContent value="dre" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Demonstrativo de Resultado (DRE Simplificado)</CardTitle>
              <CardDescription>Visao resumida de receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Receitas */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Receitas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 px-3 rounded bg-emerald-50/50">
                      <span>Ordens de Servico (liquidadas)</span>
                      <span className="font-medium text-emerald-700">{formatCurrency(totalReceitaOS)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded bg-emerald-50/50">
                      <span>Parcelas de Contratos (pagas)</span>
                      <span className="font-medium text-emerald-700">{formatCurrency(totalReceitaParcelas)}</span>
                    </div>
                    {totalReceitaLanc > 0 && (
                      <div className="flex justify-between py-2 px-3 rounded bg-emerald-50/50">
                        <span>Outras Receitas</span>
                        <span className="font-medium text-emerald-700">{formatCurrency(totalReceitaLanc)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 px-3 rounded bg-emerald-100 font-bold">
                      <span>Receita Bruta Total</span>
                      <span className="text-emerald-800">{formatCurrency(receitaBruta)}</span>
                    </div>
                  </div>
                </div>

                {/* Despesas */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Despesas</h3>
                  <div className="space-y-2">
                    {despesasPorCat.map(c => (
                      <div key={c.id} className="flex justify-between py-2 px-3 rounded bg-red-50/50">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.cor }} />
                          <span>{c.nome}</span>
                        </div>
                        <span className="font-medium text-red-700">-{formatCurrency(c.total)}</span>
                      </div>
                    ))}
                    {despesasPorCat.length === 0 && (
                      <div className="flex justify-between py-2 px-3 rounded bg-muted">
                        <span className="text-muted-foreground">Sem despesas registradas</span>
                        <span>R$ 0,00</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 px-3 rounded bg-red-100 font-bold">
                      <span>Despesa Total</span>
                      <span className="text-red-800">-{formatCurrency(totalDespesas)}</span>
                    </div>
                  </div>
                </div>

                {/* Resultado */}
                <div className={`flex justify-between py-4 px-4 rounded-lg font-bold text-lg ${receitaBruta - totalDespesas >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
                  <span>Resultado Liquido</span>
                  <span>{formatCurrency(receitaBruta - totalDespesas)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Novo Lancamento Dialog */}
      <Dialog open={showNovoLancamento} onOpenChange={setShowNovoLancamento}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Lancamento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={novoLanc.tipo} onValueChange={v => setNovoLanc(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descricao</Label>
              <Input value={novoLanc.descricao} onChange={e => setNovoLanc(p => ({ ...p, descricao: e.target.value }))} placeholder="Descricao do lancamento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Valor</Label><Input type="number" step="0.01" value={novoLanc.valor} onChange={e => setNovoLanc(p => ({ ...p, valor: e.target.value }))} /></div>
              <div><Label className="text-xs">Data</Label><Input type="date" value={novoLanc.data_lancamento} onChange={e => setNovoLanc(p => ({ ...p, data_lancamento: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={novoLanc.categoria_id} onValueChange={v => setNovoLanc(p => ({ ...p, categoria_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categorias.filter(c => c.tipo === novoLanc.tipo).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={novoLanc.status} onValueChange={v => setNovoLanc(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select value={novoLanc.forma_pagamento} onValueChange={v => setNovoLanc(p => ({ ...p, forma_pagamento: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Cartao Credito">Cartao Credito</SelectItem>
                    <SelectItem value="Cartao Debito">Cartao Debito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {novoLanc.status === 'pago' && (
              <div><Label className="text-xs">Data Pagamento</Label><Input type="date" value={novoLanc.data_pagamento} onChange={e => setNovoLanc(p => ({ ...p, data_pagamento: e.target.value }))} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoLancamento(false)}>Cancelar</Button>
            <Button onClick={handleNovoLancamento} disabled={saving}>{saving ? 'Salvando...' : 'Criar Lancamento'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
