'use client'
import { generateOrderPDF } from '@/lib/pdf-os'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionMenu } from '@/components/ui/action-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Edit, Eye, FileText, Download, Printer, Shield, Users, MoreHorizontal, Palette, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDateBRFromYYYYMMDD, parseDateFromYYYYMMDD } from '@/lib/utils'
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
  const searchParams = useSearchParams()
  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view')
  const [showVisualEditor, setShowVisualEditor] = useState(searchParams?.get('visual') === '1')
  const [template, setTemplate] = useState<any>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  
  // Local state for color inputs - updates instantly for UI, preview updates with delay
  const [colorInputs, setColorInputs] = useState<any>({})
  const [colorTimeouts, setColorTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (params?.id) {
      fetchOrdem()
    }
  }, [params?.id])

  const fetchOrdem = async () => {
    try {
      setLoading(true)
      console.log('[OrdemDetalhes] Fetching order:', params?.id)
      const response = await fetch(`/api/ordens/${params?.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('[OrdemDetalhes] Got order:', data)
        setOrdem(data)
      } else {
        console.error('[OrdemDetalhes] Response not ok:', response.status)
        router.push('/dashboard/ordens')
      }
    } catch (error) {
      console.error('[OrdemDetalhes] Fetch error:', error)
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

  // Memoized callbacks to prevent lag on rapid changes
  const handleTemplateChange = useCallback((key: string, value: any) => {
    setTemplate((prev: any) => ({ ...(prev || {}), [key]: value }))
  }, [])

  const handleColorChange = useCallback((key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate((prev: any) => ({ ...(prev || {}), [key]: e.target.value }))
  }, [])

  const handleRangeChange = useCallback((key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate((prev: any) => ({ ...(prev || {}), [key]: Number(e.target.value) }))
  }, [])

  const handleTextChange = useCallback((key: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTemplate((prev: any) => ({ ...(prev || {}), [key]: e.target.value }))
  }, [])

  // Color handler: input updates instantly, preview updates with 300ms debounce
  const handleColorInputChange = useCallback((key: string, value: string) => {
    // Update input value instantly for immediate visual feedback
    setColorInputs((prev: any) => ({ ...prev, [key]: value }))
    
    // Clear any existing timeout for this color
    if (colorTimeouts[key]) {
      clearTimeout(colorTimeouts[key])
    }
    
    // Debounce the template update to 300ms
    const timeout = setTimeout(() => {
      setTemplate((prev: any) => ({ ...prev, [key]: value }))
      setColorTimeouts((prev: any) => {
        const newTimeouts = { ...prev }
        delete newTimeouts[key]
        return newTimeouts
      })
    }, 300)
    
    setColorTimeouts((prev: any) => ({ ...prev, [key]: timeout }))
  }, [colorTimeouts])

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch('/api/templates?tipo=os')
        if (res.ok) {
          const t = await res.json()
          if (t) {
            let extras = {}
            try { if (t.campos_visiveis) extras = typeof t.campos_visiveis === 'string' ? JSON.parse(t.campos_visiveis) : t.campos_visiveis } catch (e) { extras = {} }
            setTemplate({ ...t, ...extras })
            setColorInputs({}) // Reset color inputs
          } else setTemplate({ tipo: 'os', nome_empresa: '', subtitulo_empresa: '', logo_url: '', cor_primaria: '#ea580c', cor_secundaria: '#f97316', cor_texto: '#1f2937', fonte_familia: 'Times New Roman', fonte_tamanho: 12, mostrar_borda: true, estilo_borda: 'double', texto_rodape: '', texto_assinatura: '', nome_assinatura: '', cargo_assinatura: '', logo_position: 'center', logo_size: 100 })
        }
      } catch (e) {
        console.error('Erro ao carregar template:', e)
      }
    }
    if (showVisualEditor) loadTemplate()
  }, [showVisualEditor])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(colorTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const handlePrint = async () => {
    try {
      if (!ordem) return
      const pdfBlob = await generateOrderPDF(ordem)
      const url = URL.createObjectURL(pdfBlob)

      const printWindow = window.open(url)
      if (printWindow) {
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      toast.success('OS enviada para impressão!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao imprimir PDF')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      if (!ordem) return
      const pdfBlob = await generateOrderPDF(ordem)
      const url = URL.createObjectURL(pdfBlob)

      const a = document.createElement('a')
      a.href = url
      a.download = `OS-${ordem.numero_os}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(url)
      toast.success('PDF baixado com sucesso!')
    } catch (error) {
      console.error(error)
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
      label: 'Editar Visual',
      icon: <Palette className="h-4 w-4" />,
      onClick: () => setShowVisualEditor(true)
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

        {/* Visual Editor Dialog */}
        <Dialog open={showVisualEditor} onOpenChange={setShowVisualEditor}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Visual da OS</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Identidade Visual</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Nome da Empresa</Label>
                      <Input value={template?.nome_empresa || ''} onChange={(e) => handleTextChange('nome_empresa', e)} />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitulo</Label>
                      <Input value={template?.subtitulo_empresa || ''} onChange={(e) => handleTextChange('subtitulo_empresa', e)} />
                    </div>
                    <div>
                      <Label className="text-xs">URL do Logo</Label>
                      <Input placeholder="https://..." value={template?.logo_url || ''} onChange={(e) => handleTextChange('logo_url', e)} />
                      <div className="flex items-center gap-2 mt-2">
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const f = (e.target as HTMLInputElement).files?.[0]
                          if (!f) return
                          const fd = new FormData()
                          fd.append('file', f)
                          try {
                            const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                            if (res.ok) {
                              const data = await res.json()
                              setTemplate((prev: any) => ({ ...(prev||{}), logo_url: data.url }))
                              toast.success('Logo enviado!')
                            } else {
                              toast.error('Erro ao enviar imagem')
                            }
                          } catch (err) { toast.error('Erro ao enviar imagem') }
                        }} />
                        <Button variant="ghost" onClick={() => { if (template?.logo_url) navigator.clipboard.writeText(template.logo_url); }}>{template?.logo_url ? 'Copiar URL' : 'Sem logo'}</Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Posição do Logo</Label>
                      <Select value={template?.logo_position || 'center'} onValueChange={v => handleTemplateChange('logo_position', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tamanho do Logo (%)</Label>
                      <input type="range" min={20} max={200} value={template?.logo_size || 100} onChange={(e) => handleRangeChange('logo_size', e)} />
                      <div className="text-xs text-muted-foreground">{template?.logo_size || 100}%</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Cor Primaria</Label>
                        <div className="flex items-center gap-1">
                          <Input type="color" value={colorInputs.cor_primaria ?? template?.cor_primaria ?? '#ea580c'} onChange={(e) => handleColorInputChange('cor_primaria', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                          <span className="text-xs text-muted-foreground font-mono">{colorInputs.cor_primaria ?? template?.cor_primaria ?? '#ea580c'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Cor Secundaria</Label>
                        <div className="flex items-center gap-1">
                          <Input type="color" value={colorInputs.cor_secundaria ?? template?.cor_secundaria ?? '#f97316'} onChange={(e) => handleColorInputChange('cor_secundaria', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                          <span className="text-xs text-muted-foreground font-mono">{colorInputs.cor_secundaria ?? template?.cor_secundaria ?? '#f97316'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Cor Texto</Label>
                        <div className="flex items-center gap-1">
                          <Input type="color" value={colorInputs.cor_texto ?? template?.cor_texto ?? '#1f2937'} onChange={(e) => handleColorInputChange('cor_texto', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                          <span className="text-xs text-muted-foreground font-mono">{colorInputs.cor_texto ?? template?.cor_texto ?? '#1f2937'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Assinatura e Rodape</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Nome da Assinatura</Label>
                      <Input value={template?.nome_assinatura || ''} onChange={(e) => handleTextChange('nome_assinatura', e)} />
                    </div>
                    <div>
                      <Label className="text-xs">Cargo</Label>
                      <Input value={template?.cargo_assinatura || ''} onChange={(e) => handleTextChange('cargo_assinatura', e)} />
                    </div>
                    <div>
                      <Label className="text-xs">Texto da Assinatura (opcional)</Label>
                      <Textarea value={template?.texto_assinatura || ''} onChange={(e) => handleTextChange('texto_assinatura', e)} rows={2} />
                    </div>
                    <div>
                      <Label className="text-xs">Texto do Rodape (opcional)</Label>
                      <Textarea value={template?.texto_rodape || ''} onChange={(e) => handleTextChange('texto_rodape', e)} rows={2} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button onClick={async () => {
                    setSavingTemplate(true)
                    try {
                      const payload = { ...template, tipo: 'os', campos_visiveis: JSON.stringify({ logo_position: template?.logo_position || 'center', logo_size: template?.logo_size || 100 }) }
                      const res = await fetch('/api/templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                      if (res.ok) { toast.success('Template salvo!') }
                      else toast.error('Erro ao salvar template')
                    } catch (e) { toast.error('Erro ao salvar template') }
                    finally { setSavingTemplate(false) }
                  }} disabled={savingTemplate} className="flex-1">
                    {savingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowVisualEditor(false)}>Fechar</Button>
                </div>
              </div>

              <div className="lg:col-span-3">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Preview</CardTitle></CardHeader>
                  <CardContent>
                    <PreviewContent template={template} ordem={ordem} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  {formatDateBRFromYYYYMMDD(ordem.data_execucao)}
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
                    Em {formatDateBRFromYYYYMMDD(ordem.data_liquidacao)}
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
                    Válida até {(() => {
                      const exec = parseDateFromYYYYMMDD(ordem.data_execucao) || new Date(0)
                      const valid = new Date(exec)
                      valid.setMonth(valid.getMonth() + (ordem.garantia_meses || 0))
                      return formatDateBRFromYYYYMMDD(valid)
                    })()}
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

// Memoized Preview Component to prevent lag on color changes
const PreviewContent = React.memo(({ template, ordem }: { template: any; ordem: any }) => {
  const html = useMemo(() => generateOsPreviewInline(template || {}, ordem), [template, ordem])
  return (
    <div className="bg-white rounded-lg shadow-inner overflow-auto max-h-[80vh]">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
})
PreviewContent.displayName = 'PreviewContent'

function generateOsPreviewInline(t: any, ordem: any): string {
  if (!t) t = {}
  const borderStyle = t.mostrar_borda ? `border: ${t.estilo_borda === 'double' ? '3px' : '2px'} ${t.estilo_borda || 'solid'} ${t.cor_primaria || '#ea580c'}; padding: 30px;` : 'padding: 30px;'
  const cliente = ordem?.cliente || {}
  const formatDate = (d: string) => d ? formatDateBRFromYYYYMMDD(d, { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
  
  // Logo alignment based on position
  const logoAlignmentMap: Record<string, string> = {
    'left': 'flex-start',
    'center': 'center',
    'right': 'flex-end'
  }
  const logoAlignment = logoAlignmentMap[t.logo_position || 'center'] || 'center'
  
  const logoSize = Math.min(Math.max(t.logo_size || 100, 20), 200) // Clamp between 20% and 200%
  
  return `
    <div style="${borderStyle} font-family: ${t.fonte_familia || 'Times New Roman'}, serif; font-size: ${t.fonte_tamanho || 12}px; color: ${t.cor_texto || '#1f2937'}; background: white;">
      ${t.logo_url ? `<div style="display: flex; justify-content: ${logoAlignment}; margin-bottom: 16px;"><img src="${t.logo_url}" alt="Logo" style="max-height: ${logoSize * 0.5}px; object-fit: contain;" crossorigin="anonymous" /></div>` : ''}
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 22px; font-weight: bold; color: ${t.cor_primaria || '#ea580c'}; text-transform: uppercase; letter-spacing: 1px;">${t.nome_empresa || 'Ordem de Servico'}</div>
        <div style="font-size: 12px; color: ${t.cor_primaria || '#ea580c'}; margin-top: 2px;">${t.subtitulo_empresa || ''}</div>
      </div>
      <div style="height: 2px; background: linear-gradient(to right, transparent, ${t.cor_primaria || '#ea580c'}, transparent); margin: 16px 0;"></div>
      <div style="text-align: center; font-size: 16px; font-weight: bold; color: ${t.cor_primaria || '#ea580c'}; margin-bottom: 16px;">${ordem?.numero_os || 'OS-000000'}</div>
      <div style="font-size: 13px; font-weight: bold; color: ${t.cor_primaria || '#ea580c'}; margin: 12px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0;">Dados do Cliente</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0;">
        <div style="grid-column: span 2;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Razao Social</span><div style="margin-top: 2px;">${cliente.razao_social || '-'}</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">CNPJ</span><div style="margin-top: 2px;">${cliente.cnpj || '-'}</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Telefone</span><div style="margin-top: 2px;">${cliente.telefone || '-'}</div></div>
      </div>
      <div style="font-size: 13px; font-weight: bold; color: ${t.cor_primaria || '#ea580c'}; margin: 12px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0;">Dados do Servico</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0;">
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Tipo de Servico</span><div style="margin-top: 2px;">${ordem?.tipo_servico || '-'}</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Data de Execucao</span><div style="margin-top: 2px;">${formatDate(ordem?.data_execucao)}</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Tecnico</span><div style="margin-top: 2px;">${ordem?.tecnico_responsavel || '-'}</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Valor</span><div style="margin-top: 2px;">${ordem?.valor ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(ordem.valor) : '-'}</div></div>
        <div style="grid-column: span 2;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Descricao</span><div style="margin-top: 2px;">${ordem?.descricao_servico || '-'}</div></div>
      </div>
      <div style="margin-top: 40px; text-align: center;">
        ${t.texto_assinatura ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 16px;">${t.texto_assinatura}</p>` : ''}
        <div style="width: 200px; border-top: 1px solid ${t.cor_texto || '#1f2937'}; margin: 0 auto 6px;"></div>
        <div style="font-size: 12px; font-weight: 500;">${t.nome_assinatura || 'Responsavel'}</div>
        <div style="font-size: 11px; color: #64748b;">${t.cargo_assinatura || ''}</div>
      </div>
      ${t.texto_rodape ? `<div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">${t.texto_rodape}</div>` : ''}
    </div>
  `
}
