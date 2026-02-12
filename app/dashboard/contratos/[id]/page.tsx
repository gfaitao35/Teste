'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, DollarSign, FileText, CheckCircle, Clock, XCircle, RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'
import { BaixaParcelaDialog } from '@/components/financeiro/baixa-parcela-dialog'
import { toast } from 'sonner'

interface Contrato {
  id: string
  numero_contrato: string
  cliente_id: string
  razao_social: string
  nome_fantasia: string | null
  data_inicio: string
  data_fim: string
  valor_total: number
  numero_parcelas: number
  valor_parcela: number
  dia_vencimento: number
  status: string
  observacoes: string | null
  created_at: string
}

interface Parcela {
  id: string
  numero_parcela: number
  valor_parcela: number
  data_vencimento: string
  data_pagamento: string | null
  valor_pago: number | null
  status: string
  forma_pagamento: string | null
}

export default function ContratoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddParcela, setShowAddParcela] = useState(false)
  const [newParcela, setNewParcela] = useState({
    numero_parcela: '',
    valor_parcela: '',
    data_vencimento: ''
  })

  useEffect(() => {
    fetchContrato()
  }, [params.id, refreshKey])

  const fetchContrato = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contratos/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setContrato(data.contrato)
        setParcelas(data.parcelas)
      } else {
        router.push('/dashboard/contratos')
      }
    } catch (error) {
      console.error('Erro ao buscar contrato:', error)
      router.push('/dashboard/contratos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3 w-3" /> },
      suspenso: { label: 'Suspenso', className: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      concluido: { label: 'Concluído', className: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3" /> },
      paga: { label: 'Paga', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3 w-3" /> },
      pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
      atrasada: { label: 'Atrasada', className: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    }
    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: null }
  }

  const handleAddParcela = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/parcelas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newParcela,
          contrato_id: params.id,
          numero_parcela: parseInt(newParcela.numero_parcela),
          valor_parcela: parseFloat(newParcela.valor_parcela),
        }),
      })

      if (response.ok) {
        toast.success('Parcela adicionada com sucesso!')
        setShowAddParcela(false)
        setNewParcela({ numero_parcela: '', valor_parcela: '', data_vencimento: '' })
        setRefreshKey(prev => prev + 1)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar parcela')
      }
    } catch (error) {
      toast.error('Erro ao adicionar parcela')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Contrato não encontrado</p>
      </div>
    )
  }

  const parcelasPagas = parcelas.filter(p => p.status === 'paga').length
  const valorRecebido = parcelas.reduce((sum, p) => sum + (p.valor_pago || 0), 0)
  const valorPendente = parcelas.filter(p => p.status !== 'paga').reduce((sum, p) => sum + p.valor_parcela, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contratos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detalhes do Contrato</h1>
          <p className="text-muted-foreground">Contrato {contrato.numero_contrato}</p>
        </div>
      </div>

      {/* Informações do Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número do Contrato</p>
                <p className="text-lg font-semibold">{contrato.numero_contrato}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-lg font-semibold">{contrato.razao_social}</p>
                {contrato.nome_fantasia && (
                  <p className="text-sm text-muted-foreground">{contrato.nome_fantasia}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(contrato.status).icon}
                  <Badge className={getStatusBadge(contrato.status).className}>
                    {getStatusBadge(contrato.status).label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Período do Contrato</p>
                <p className="text-lg font-semibold">
                  {new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} até {new Date(contrato.data_fim).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold">{formatCurrency(contrato.valor_total)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Condições</p>
                <p className="text-lg font-semibold">
                  {contrato.numero_parcelas}x de {formatCurrency(contrato.valor_parcela)}
                </p>
                <p className="text-sm text-muted-foreground">Vencimento dia {contrato.dia_vencimento}</p>
              </div>
            </div>
          </div>

          {contrato.observacoes && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground">Observações</p>
              <p className="mt-1 text-sm">{contrato.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parcelas Pagas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{parcelasPagas}/{contrato.numero_parcelas}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(valorRecebido)} recebido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Pendente
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(valorPendente)}</div>
            <p className="text-xs text-muted-foreground">
              {contrato.numero_parcelas - parcelasPagas} parcelas restantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((parcelasPagas / contrato.numero_parcelas) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              do contrato concluído
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de adicionar parcela */}
      <Dialog open={showAddParcela} onOpenChange={() => setShowAddParcela(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Parcela</DialogTitle>
            <DialogDescription>
              Adicione uma nova parcela ao contrato {contrato.numero_contrato}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddParcela} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numero_parcela" className="text-right">
                  Número da Parcela
                </Label>
                <Input
                  id="numero_parcela"
                  type="number"
                  min="1"
                  value={newParcela.numero_parcela}
                  onChange={(e) => setNewParcela(prev => ({...prev, numero_parcela: e.target.value}))}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor_parcela" className="text-right">
                  Valor da Parcela
                </Label>
                <Input
                  id="valor_parcela"
                  type="number"
                  step="0.01"
                  value={newParcela.valor_parcela}
                  onChange={(e) => setNewParcela(prev => ({...prev, valor_parcela: e.target.value}))}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_vencimento" className="text-right">
                  Data Vencimento
                </Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={newParcela.data_vencimento}
                  onChange={(e) => setNewParcela(prev => ({...prev, data_vencimento: e.target.value}))}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
          </form>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddParcela(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={handleAddParcela}
            >
              Adicionar Parcela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Parcelas do Contrato
          </CardTitle>
          <CardDescription>Gerencie as parcelas do contrato</CardDescription>
          <Button 
            size="sm" 
            onClick={() => setShowAddParcela(true)}
            className="ml-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Parcela
          </Button>
        </CardHeader>
        <CardContent>
          {parcelas.length > 0 ? (
            <div className="space-y-4">
              {parcelas.map((parcela) => {
                const statusBadge = getStatusBadge(parcela.status)
                return (
                  <div key={parcela.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Parcela {parcela.numero_parcela}/{contrato.numero_parcelas}</p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                      {parcela.data_pagamento && (
                        <p className="text-sm text-muted-foreground">
                          Pagamento: {new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {parcela.forma_pagamento && (
                        <p className="text-sm text-muted-foreground">
                          Forma: {parcela.forma_pagamento}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(parcela.valor_parcela)}</p>
                        {parcela.valor_pago && parcela.valor_pago !== parcela.valor_parcela && (
                          <p className="text-sm text-muted-foreground">
                            Pago: {formatCurrency(parcela.valor_pago)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge.icon}
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <BaixaParcelaDialog 
                        parcela={parcela} 
                        onUpdate={() => setRefreshKey(prev => prev + 1)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma parcela encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
