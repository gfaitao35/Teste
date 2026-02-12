import { getDb } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FinanceiroTable } from '@/components/financeiro/financeiro-table'
import { DollarSign, TrendingUp, Calendar, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { OrdemServico, Cliente, Contrato, Parcela } from '@/lib/types'

function rowToCliente(row: Record<string, unknown>): Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'> {
  return {
    id: row.id as string,
    razao_social: row.razao_social as string,
    nome_fantasia: (row.nome_fantasia as string) || null,
  }
}

function rowToOrdem(row: Record<string, unknown>, cliente?: Cliente): OrdemServico {
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
    garantia_meses: (row.garantia_meses as number) ?? null,
    visitas_gratuitas: (row.visitas_gratuitas as number) ?? 0,
    contrato_id: (row.contrato_id as string) ?? null,
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
    .prepare('SELECT * FROM clientes WHERE user_id = ?')
    .all(userId) as Record<string, unknown>[]
  
  // Buscar contratos e parcelas
  const contratosRows = database
    .prepare(`
      SELECT c.*, cl.razao_social 
      FROM contratos c 
      LEFT JOIN clientes cl ON c.cliente_id = cl.id 
      WHERE c.user_id = ?
    `)
    .all(userId) as Record<string, unknown>[]
  
  const parcelasRows = database
    .prepare(`
      SELECT p.*, c.numero_contrato, cl.razao_social as cliente_razao_social
      FROM parcelas p
      LEFT JOIN contratos c ON p.contrato_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.user_id = ?
      ORDER BY p.data_vencimento ASC
    `)
    .all(userId) as Record<string, unknown>[]

  const clientesMap = new Map<string, Cliente>()
  for (const r of clientesRows) {
    clientesMap.set(r.id as string, {
      id: r.id as string,
      razao_social: r.razao_social as string,
      nome_fantasia: (r.nome_fantasia as string) || null,
      cnpj: r.cnpj as string,
      endereco: (r.endereco as string) || null,
      cidade: (r.cidade as string) || null,
      estado: (r.estado as string) || null,
      cep: (r.cep as string) || null,
      telefone: (r.telefone as string) || null,
      email: (r.email as string) || null,
      contato_responsavel: (r.contato_responsavel as string) || null,
      observacoes: (r.observacoes as string) || null,
      ativo: (r.ativo as number) === 1,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      user_id: r.user_id as string,
    })
  }
  const ordens = ordensRows.map((r) => rowToOrdem(r, clientesMap.get(r.cliente_id as string)))

  const totalPendente = ordens.filter((o) => !o.liquidado && o.valor).reduce((s, o) => s + (o.valor ?? 0), 0)
  const totalLiquidado = ordens.filter((o) => o.liquidado).reduce((s, o) => s + (o.valor_pago ?? o.valor ?? 0), 0)
  
  // Calcular totais de contratos e parcelas
  const totalContratosAtivos = contratosRows.filter((c: any) => c.status === 'ativo').length
  const totalParcelasPendentes = parcelasRows.filter((p: any) => p.status === 'pendente').reduce((s: number, p: any) => s + p.valor_parcela, 0)
  const totalParcelasPagas = parcelasRows.filter((p: any) => p.status === 'paga').reduce((s: number, p: any) => s + (p.valor_pago || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie ordens de serviço e contratos. Marque como pago quando o cliente quitar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OS Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordens de serviço a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OS Recebidas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalLiquidado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordens de serviço liquidadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parcelas Pendentes
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParcelasPendentes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Contratos a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parcelas Recebidas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParcelasPagas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Contratos liquidadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ordens de Serviço
            </CardTitle>
            <CardDescription>Gerencie as ordens de serviço avulsas</CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceiroTable ordens={ordens} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Contratos e Parcelas
            </CardTitle>
            <CardDescription>Gerencie os contratos e suas parcelas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contratos Ativos</span>
                <Badge variant="secondary">{totalContratosAtivos}</Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Próximos Vencimentos</p>
                {parcelasRows.slice(0, 5).map((parcela: any) => (
                  <div key={parcela.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{parcela.numero_contrato}</p>
                      <p className="text-xs text-muted-foreground">{parcela.cliente_razao_social}</p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {parcela.numero_parcela} - {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor_parcela)}
                      </p>
                      <Badge 
                        className={
                          parcela.status === 'paga' ? 'bg-emerald-100 text-emerald-800' :
                          parcela.status === 'atrasada' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }
                      >
                        {parcela.status === 'paga' ? 'Paga' :
                         parcela.status === 'atrasada' ? 'Atrasada' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {parcelasRows.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhuma parcela encontrada</p>
                )}
              </div>
              
              <Link href="/dashboard/contratos">
                <Button className="w-full mt-4">
                  Gerenciar Contratos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
