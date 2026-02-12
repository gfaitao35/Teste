'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Download, Eye, Save } from 'lucide-react'
import Link from 'next/link'

export default function PdfEditorPage() {
  const [template, setTemplate] = useState('os')
  const [headerColor, setHeaderColor] = useState('#ff6b35')
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('Sua Empresa')
  const [fontSize, setFontSize] = useState('12')
  const [fontFamily, setFontFamily] = useState('Arial')

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
          <h1 className="text-2xl font-bold">Editor de PDF</h1>
          <p className="text-muted-foreground">Personalize a aparência dos seus documentos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Documento</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="os">Ordem de Serviço</SelectItem>
                  <SelectItem value="certificado">Certificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cor do Cabeçalho</Label>
              <Input 
                type="color" 
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
              />
            </div>

            <div>
              <Label>URL do Logo</Label>
              <Input 
                placeholder="https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div>
              <Label>Nome da Empresa</Label>
              <Input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <Label>Tamanho da Fonte</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10px</SelectItem>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Família da Fonte</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Prévia</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-6 min-h-[400px]"
              style={{ 
                backgroundColor: '#fff',
                fontFamily,
                fontSize: `${fontSize}px`
              }}
            >
              <div 
                className="mb-4 p-4 rounded"
                style={{ backgroundColor: headerColor }}
              >
                <h2 className="text-white text-xl font-bold">{companyName}</h2>
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-12 mt-2" />
                )}
              </div>
              
              <div className="space-y-2">
                <p>Exemplo de conteúdo do documento...</p>
                <p>Este é um preview de como seu {template === 'os' ? 'Ordem de Serviço' : 'Certificado'} ficará.</p>
                <p>As configurações serão aplicadas a todos os documentos gerados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
