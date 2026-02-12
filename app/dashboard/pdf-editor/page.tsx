'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Palette, Type, LayoutTemplate, FileSignature, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface TemplateConfig {
  tipo: 'os' | 'certificado'
  nome_empresa: string
  subtitulo_empresa: string
  logo_url: string
  cor_primaria: string
  cor_secundaria: string
  cor_texto: string
  fonte_familia: string
  fonte_tamanho: number
  mostrar_borda: boolean
  estilo_borda: string
  texto_rodape: string
  texto_assinatura: string
  nome_assinatura: string
  cargo_assinatura: string
}

const defaultTemplate: TemplateConfig = {
  tipo: 'os',
  nome_empresa: 'Sua Empresa',
  subtitulo_empresa: 'Controle de Pragas Urbanas',
  logo_url: '',
  cor_primaria: '#ea580c',
  cor_secundaria: '#f97316',
  cor_texto: '#1f2937',
  fonte_familia: 'Times New Roman',
  fonte_tamanho: 12,
  mostrar_borda: true,
  estilo_borda: 'double',
  texto_rodape: '',
  texto_assinatura: '',
  nome_assinatura: 'Responsavel Tecnico',
  cargo_assinatura: 'Controlador de Pragas',
}

export default function PdfEditorPage() {
  const [activeTab, setActiveTab] = useState<'os' | 'certificado'>('os')
  const [osTemplate, setOsTemplate] = useState<TemplateConfig>({ ...defaultTemplate, tipo: 'os' })
  const [certTemplate, setCertTemplate] = useState<TemplateConfig>({ ...defaultTemplate, tipo: 'certificado', cor_primaria: '#1e40af', cor_secundaria: '#3b82f6', estilo_borda: 'double' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentTemplate = activeTab === 'os' ? osTemplate : certTemplate
  const setCurrentTemplate = activeTab === 'os' ? setOsTemplate : setCertTemplate

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates')
        if (res.ok) {
          const templates = await res.json()
          if (Array.isArray(templates)) {
            for (const t of templates) {
              const parsed: TemplateConfig = {
                tipo: t.tipo,
                nome_empresa: t.nome_empresa || defaultTemplate.nome_empresa,
                subtitulo_empresa: t.subtitulo_empresa || defaultTemplate.subtitulo_empresa,
                logo_url: t.logo_url || '',
                cor_primaria: t.cor_primaria || defaultTemplate.cor_primaria,
                cor_secundaria: t.cor_secundaria || defaultTemplate.cor_secundaria,
                cor_texto: t.cor_texto || defaultTemplate.cor_texto,
                fonte_familia: t.fonte_familia || defaultTemplate.fonte_familia,
                fonte_tamanho: t.fonte_tamanho || defaultTemplate.fonte_tamanho,
                mostrar_borda: t.mostrar_borda === 1 || t.mostrar_borda === true,
                estilo_borda: t.estilo_borda || defaultTemplate.estilo_borda,
                texto_rodape: t.texto_rodape || '',
                texto_assinatura: t.texto_assinatura || '',
                nome_assinatura: t.nome_assinatura || defaultTemplate.nome_assinatura,
                cargo_assinatura: t.cargo_assinatura || defaultTemplate.cargo_assinatura,
              }
              if (t.tipo === 'os') setOsTemplate(parsed)
              else setCertTemplate(parsed)
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar templates:', e)
      } finally {
        setLoading(false)
      }
    }
    loadTemplates()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate),
      })
      if (res.ok) {
        toast.success('Template salvo com sucesso!')
      } else {
        toast.error('Erro ao salvar template')
      }
    } catch {
      toast.error('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const updateField = useCallback((field: keyof TemplateConfig, value: any) => {
    setCurrentTemplate(prev => ({ ...prev, [field]: value }))
  }, [setCurrentTemplate])

  const handlePrintPreview = () => {
    const previewHtml = activeTab === 'os' ? generateOsPreview(currentTemplate) : generateCertPreview(currentTemplate)
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(previewHtml)
      w.document.close()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personalizar Documentos</h1>
          <p className="text-muted-foreground">Configure o estilo visual da OS e do Certificado</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'os' | 'certificado')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="os">Ordem de Servico</TabsTrigger>
          <TabsTrigger value="certificado">Certificado</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Settings Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="h-4 w-4" />
                    Identidade Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Nome da Empresa</Label>
                    <Input value={currentTemplate.nome_empresa} onChange={e => updateField('nome_empresa', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Subtitulo</Label>
                    <Input value={currentTemplate.subtitulo_empresa} onChange={e => updateField('subtitulo_empresa', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">URL do Logo</Label>
                    <Input placeholder="https://..." value={currentTemplate.logo_url} onChange={e => updateField('logo_url', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Cor Primaria</Label>
                      <div className="flex items-center gap-1">
                        <Input type="color" value={currentTemplate.cor_primaria} onChange={e => updateField('cor_primaria', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                        <span className="text-xs text-muted-foreground">{currentTemplate.cor_primaria}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Cor Secundaria</Label>
                      <div className="flex items-center gap-1">
                        <Input type="color" value={currentTemplate.cor_secundaria} onChange={e => updateField('cor_secundaria', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                        <span className="text-xs text-muted-foreground">{currentTemplate.cor_secundaria}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Cor Texto</Label>
                      <div className="flex items-center gap-1">
                        <Input type="color" value={currentTemplate.cor_texto} onChange={e => updateField('cor_texto', e.target.value)} className="h-9 w-12 p-1 cursor-pointer" />
                        <span className="text-xs text-muted-foreground">{currentTemplate.cor_texto}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Type className="h-4 w-4" />
                    Tipografia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Familia da Fonte</Label>
                    <Select value={currentTemplate.fonte_familia} onValueChange={v => updateField('fonte_familia', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tamanho da Fonte: {currentTemplate.fonte_tamanho}px</Label>
                    <Select value={String(currentTemplate.fonte_tamanho)} onValueChange={v => updateField('fonte_tamanho', Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[10, 11, 12, 13, 14, 16].map(s => (
                          <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutTemplate className="h-4 w-4" />
                    Layout e Borda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mostrar Borda</Label>
                    <Switch checked={currentTemplate.mostrar_borda} onCheckedChange={v => updateField('mostrar_borda', v)} />
                  </div>
                  {currentTemplate.mostrar_borda && (
                    <div>
                      <Label className="text-xs">Estilo da Borda</Label>
                      <Select value={currentTemplate.estilo_borda} onValueChange={v => updateField('estilo_borda', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solida</SelectItem>
                          <SelectItem value="double">Dupla</SelectItem>
                          <SelectItem value="dashed">Tracejada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileSignature className="h-4 w-4" />
                    Assinatura e Rodape
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Nome da Assinatura</Label>
                    <Input value={currentTemplate.nome_assinatura} onChange={e => updateField('nome_assinatura', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Cargo</Label>
                    <Input value={currentTemplate.cargo_assinatura} onChange={e => updateField('cargo_assinatura', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Texto da Assinatura (opcional)</Label>
                    <Textarea value={currentTemplate.texto_assinatura} onChange={e => updateField('texto_assinatura', e.target.value)} rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Texto do Rodape (opcional)</Label>
                    <Textarea value={currentTemplate.texto_rodape} onChange={e => updateField('texto_rodape', e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Configuracoes
                </Button>
                <Button variant="outline" onClick={handlePrintPreview}>
                  Imprimir Preview
                </Button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-3">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Preview em Tempo Real</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg shadow-inner overflow-auto max-h-[80vh]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: activeTab === 'os' ? generateOsPreviewInline(currentTemplate) : generateCertPreviewInline(currentTemplate)
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function generateOsPreviewInline(t: TemplateConfig): string {
  const borderStyle = t.mostrar_borda ? `border: ${t.estilo_borda === 'double' ? '3px' : '2px'} ${t.estilo_borda} ${t.cor_primaria}; padding: 30px;` : 'padding: 30px;'
  return `
    <div style="${borderStyle} font-family: ${t.fonte_familia}, serif; font-size: ${t.fonte_tamanho}px; color: ${t.cor_texto}; background: white;">
      <div style="text-align: center; margin-bottom: 20px;">
        ${t.logo_url ? `<img src="${t.logo_url}" alt="Logo" style="max-height: 50px; margin-bottom: 8px;" crossorigin="anonymous" />` : ''}
        <div style="font-size: 22px; font-weight: bold; color: ${t.cor_primaria}; text-transform: uppercase; letter-spacing: 1px;">${t.nome_empresa || 'Ordem de Servico'}</div>
        <div style="font-size: 12px; color: ${t.cor_primaria}; margin-top: 2px;">${t.subtitulo_empresa || ''}</div>
      </div>
      <div style="height: 2px; background: linear-gradient(to right, transparent, ${t.cor_primaria}, transparent); margin: 16px 0;"></div>
      <div style="text-align: center; font-size: 16px; font-weight: bold; color: ${t.cor_primaria}; margin-bottom: 16px;">OS-000001</div>
      <div style="font-size: 13px; font-weight: bold; color: ${t.cor_primaria}; margin: 12px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0;">Dados do Cliente</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0;">
        <div style="grid-column: span 2;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Razao Social</span><div style="margin-top: 2px;">Empresa Exemplo LTDA</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">CNPJ</span><div style="margin-top: 2px;">00.000.000/0001-00</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Telefone</span><div style="margin-top: 2px;">(11) 99999-9999</div></div>
      </div>
      <div style="font-size: 13px; font-weight: bold; color: ${t.cor_primaria}; margin: 12px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0;">Dados do Servico</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 8px 0;">
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Tipo de Servico</span><div style="margin-top: 2px;">Desinsetizacao</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Data de Execucao</span><div style="margin-top: 2px;">12 de fevereiro de 2026</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Tecnico</span><div style="margin-top: 2px;">Joao Silva</div></div>
        <div><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Valor</span><div style="margin-top: 2px;">R$ 450,00</div></div>
        <div style="grid-column: span 2;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Descricao</span><div style="margin-top: 2px;">Aplicacao de gel e inseticida em todas as areas comuns do estabelecimento.</div></div>
      </div>
      <div style="margin-top: 40px; text-align: center;">
        ${t.texto_assinatura ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 16px;">${t.texto_assinatura}</p>` : ''}
        <div style="width: 200px; border-top: 1px solid ${t.cor_texto}; margin: 0 auto 6px;"></div>
        <div style="font-size: 12px; font-weight: 500;">${t.nome_assinatura || 'Responsavel'}</div>
        <div style="font-size: 11px; color: #64748b;">${t.cargo_assinatura || ''}</div>
      </div>
      ${t.texto_rodape ? `<div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">${t.texto_rodape}</div>` : ''}
    </div>
  `
}

function generateCertPreviewInline(t: TemplateConfig): string {
  const borderStyle = t.mostrar_borda ? `border: ${t.estilo_borda === 'double' ? '3px' : '2px'} ${t.estilo_borda} ${t.cor_primaria}; padding: 30px;` : 'padding: 30px;'
  return `
    <div style="${borderStyle} font-family: ${t.fonte_familia}, serif; font-size: ${t.fonte_tamanho}px; color: ${t.cor_texto}; background: white;">
      <div style="text-align: center; margin-bottom: 24px;">
        ${t.logo_url ? `<img src="${t.logo_url}" alt="Logo" style="max-height: 50px; margin-bottom: 8px;" crossorigin="anonymous" />` : ''}
        <div style="font-size: 26px; font-weight: bold; color: ${t.cor_primaria}; text-transform: uppercase; letter-spacing: 2px;">Certificado</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${t.subtitulo_empresa || ''}</div>
      </div>
      <div style="height: 2px; background: linear-gradient(to right, transparent, ${t.cor_primaria}, transparent); margin: 16px 0;"></div>
      <div style="text-align: center; font-size: 15px; font-weight: bold; color: ${t.cor_primaria}; margin-bottom: 16px;">Certificado N. CERT-000001</div>
      <div style="margin: 20px 0; line-height: 1.8;">
        <p>Certificamos que a empresa abaixo identificada foi submetida a servico de <strong>Desinsetizacao</strong>, em conformidade com as normas tecnicas vigentes e legislacao aplicavel.</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0;">
        <div style="grid-column: span 2; padding: 8px; background: #f8fafc; border-radius: 4px;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">Razao Social</span><div style="font-size: 13px; font-weight: 500; margin-top: 3px;">Empresa Exemplo LTDA</div></div>
        <div style="padding: 8px; background: #f8fafc; border-radius: 4px;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">CNPJ</span><div style="font-size: 13px; font-weight: 500; margin-top: 3px;">00.000.000/0001-00</div></div>
        <div style="padding: 8px; background: #f8fafc; border-radius: 4px;"><span style="font-size: 10px; color: #64748b; text-transform: uppercase;">OS Referencia</span><div style="font-size: 13px; font-weight: 500; margin-top: 3px;">OS-000001</div></div>
      </div>
      <div style="text-align: center; margin: 24px 0; padding: 12px; background: #eff6ff; border-radius: 6px;">
        <div style="font-size: 11px; color: #64748b;">Valido ate</div>
        <div style="font-size: 16px; font-weight: bold; color: ${t.cor_primaria};">12 de fevereiro de 2027</div>
      </div>
      <div style="margin-top: 40px; text-align: center;">
        ${t.texto_assinatura ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 16px;">${t.texto_assinatura}</p>` : ''}
        <div style="width: 220px; border-top: 1px solid ${t.cor_texto}; margin: 0 auto 6px;"></div>
        <div style="font-size: 12px; font-weight: 500;">${t.nome_assinatura || 'Responsavel Tecnico'}</div>
        <div style="font-size: 11px; color: #64748b;">${t.cargo_assinatura || ''}</div>
      </div>
      ${t.texto_rodape ? `<div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">${t.texto_rodape}</div>` : ''}
    </div>
  `
}

function generateOsPreview(t: TemplateConfig): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preview OS</title></head><body style="margin: 0; padding: 40px; background: #f0f0f0;"><div style="max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">${generateOsPreviewInline(t)}</div></body></html>`
}

function generateCertPreview(t: TemplateConfig): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preview Certificado</title></head><body style="margin: 0; padding: 40px; background: #f0f0f0;"><div style="max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">${generateCertPreviewInline(t)}</div></body></html>`
}
