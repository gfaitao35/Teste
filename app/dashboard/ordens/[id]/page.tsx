'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionMenu } from '@/components/ui/action-menu'
import { ArrowLeft, Edit, Eye, FileText, Download, Printer, Shield, Users, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OrdemServico {
  id: string
  numero_os: string
  cliente_id: string
  cliente?: {
    razao_social: string
    nome_fantasia: string | null
  }
  data_execucao: string
  tipo_servico: string
  descricao_servico: string | null
  local_execucao: string | null
  equipamentos_utilizados: string | null
  produtos_aplicados: string | null
  area_tratada: string | null
  pragas_alvo: string | null
  observacoes: string | null
  tecnico_responsavel: string | null
  status: string
  valor: number | null
  liquidado: boolean
  data_liquidacao: string | null
  valor_pago: number | null
  garantia_meses: number | null
  visitas_gratuitas: number
  created_at: string
}

export default function OrdemDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')

  useEffect(() => {
    fetchOrdem()
  }, [params.id])

  const fetchOrdem = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ordens/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrdem(data)
      } else {
        router.push('/dashboard/ordens')
      }
    } catch (error) {
      console.error('Erro ao buscar ordem:', error)
      router.push('/dashboard/ordens')
    } finally {
      setLoading(false)
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/ordens/${params.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `OS-${ordem?.numero_os}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('PDF baixado com sucesso!')
      } else {
        toast.error('Erro ao baixar PDF')
      }
    } catch (error) {
      toast.error('Erro ao baixar PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ordem de serviço não encontrada</p>
      </div>
    )
  }

  const actionItems = [
    {
      label: 'Visualizar',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewMode('view')
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => router.push(`/dashboard/ordens/${params.id}/edit`)
    },
    {
      label: 'Gerar Certificado',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => router.push(`/dashboard/certificados/novo?ordem_id=${params.id}`)
    },
    {
      label: 'Baixar PDF',
      icon: <Download className="h-4 w-4" />,
      onClick: handleDownloadPDF
    },
    {
      label: 'Imprimir',
      icon: <Printer className="h-4 w-4" />,
      onClick: handlePrint
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ordens">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ordem de Serviço</h1>
            <p className="text-muted-foreground">OS {ordem.numero_os}</p>
          </div>
        </div>
        
        <ActionMenu items={actionItems}>
          <MoreHorizontal className="h-4 w-4" />
        </ActionMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações Principais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da OS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número da OS</p>
                <p className="font-semibold">{ordem.numero_os}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge className={getStatusBadge(ordem.status).className}>
                    {getStatusBadge(ordem.status).label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Execução</p>
                <p className="font-semibold">
                  {new Date(ordem.data_execucao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Serviço</p>
                <p className="font-semibold">{ordem.tipo_servico}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="font-semibold">{ordem.cliente?.razao_social}</p>
              {ordem.cliente?.nome_fantasia && (
                <p className="text-sm text-muted-foreground">{ordem.cliente.nome_fantasia}</p>
              )}
            </div>

            {ordem.descricao_servico && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição do Serviço</p>
                <p className="text-sm">{ordem.descricao_servico}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {ordem.local_execucao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local de Execução</p>
                  <p className="text-sm">{ordem.local_execucao}</p>
                </div>
              )}
              {ordem.area_tratada && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Área Tratada</p>
                  <p className="text-sm">{ordem.area_tratada}</p>
                </div>
              )}
              {ordem.tecnico_responsavel && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Técnico Responsável</p>
                  <p className="text-sm">{ordem.tecnico_responsavel}</p>
                </div>
              )}
              {ordem.pragas_alvo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pragas Alvo</p>
                  <p className="text-sm">{ordem.pragas_alvo}</p>
                </div>
              )}
            </div>

            {ordem.produtos_aplicados && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Aplicados</p>
                <p className="text-sm whitespace-pre-line">{ordem.produtos_aplicados}</p>
              </div>
            )}

            {ordem.equipamentos_utilizados && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Equipamentos Utilizados</p>
                <p className="text-sm whitespace-pre-line">{ordem.equipamentos_utilizados}</p>
              </div>
            )}

            {ordem.observacoes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="text-sm whitespace-pre-line">{ordem.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor do Serviço</p>
                <p className="text-2xl font-bold text-primary">
                  {ordem.valor ? formatCurrency(ordem.valor) : 'Não informado'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status de Pagamento</p>
                <Badge 
                  variant={ordem.liquidado ? "default" : "secondary"}
                  className="w-full justify-center"
                >
                  {ordem.liquidado ? 'Liquidado' : 'Pendente'}
                </Badge>
                {ordem.data_liquidacao && (
                  <p className="text-xs text-muted-foreground">
                    Em {new Date(ordem.data_liquidacao).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {ordem.valor_pago && (
                  <p className="text-sm font-medium">
                    Pago: {formatCurrency(ordem.valor_pago)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Garantia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Garantia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordem.garantia_meses ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Período de Garantia</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {ordem.garantia_meses} meses
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Válida até {new Date(
                      new Date(ordem.data_execucao).setMonth(
                        new Date(ordem.data_execucao).getMonth() + ordem.garantia_meses
                      )
                    ).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem garantia definida</p>
              )}
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitas Gratuitas</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-lg font-semibold text-primary">
                    {ordem.visitas_gratuitas}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Visitas incluídas no contrato
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
