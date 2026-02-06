'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCertificadoAction } from '@/app/dashboard/certificados/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrdemServico } from '@/lib/types'

interface CertificadoFormProps {
  ordem: OrdemServico
}

const tiposCertificado = [
  'Certificado de Dedetização',
  'Certificado de Desratização',
  'Certificado de Descupinização',
  'Certificado de Sanitização',
  'Certificado de Controle de Pragas',
  'Certificado de Limpeza de Caixa D\'água',
]

const validadeMeses = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
]

export function CertificadoForm({ ordem }: CertificadoFormProps) {
  const [loading, setLoading] = useState(false)
  const cliente = ordem.cliente as { razao_social: string; cnpj: string; endereco?: string; cidade?: string; estado?: string } | undefined

  const [formData, setFormData] = useState({
    tipo_certificado: '',
    data_emissao: new Date().toISOString().split('T')[0],
    validade_meses: '6',
    observacoes: '',
  })

  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateNumeroCertificado = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `CERT-${year}${month}-${random}`
  }

  const calculateDataValidade = (dataEmissao: string, meses: string) => {
    const date = new Date(dataEmissao)
    date.setMonth(date.getMonth() + parseInt(meses))
    return date.toISOString().split('T')[0]
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createCertificadoAction({
      ordem_servico_id: ordem.id,
      numero_certificado: generateNumeroCertificado(),
      data_emissao: formData.data_emissao,
      data_validade: calculateDataValidade(formData.data_emissao, formData.validade_meses),
      tipo_certificado: formData.tipo_certificado,
      observacoes: formData.observacoes || null,
    })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Certificado gerado com sucesso')
    setLoading(false)
    router.push('/dashboard/certificados')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Número da OS</p>
            <p className="font-mono font-medium">{ordem.numero_os}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
            <p className="font-medium">{ordem.tipo_servico}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Execução</p>
            <p className="font-medium">
              {new Date(ordem.data_execucao).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Técnico Responsável</p>
            <p className="font-medium">{ordem.tecnico_responsavel || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Razão Social</p>
            <p className="font-medium">{cliente?.razao_social || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CNPJ</p>
            <p className="font-mono font-medium">{formatCNPJ(cliente?.cnpj || '')}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Endereço</p>
            <p className="font-medium">
              {cliente?.endereco
                ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}${cliente.estado ? `/${cliente.estado}` : ''}`
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo_certificado">Tipo de Certificado *</Label>
          <Select
            value={formData.tipo_certificado}
            onValueChange={(value) => handleChange('tipo_certificado', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposCertificado.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_emissao">Data de Emissão *</Label>
          <Input
            id="data_emissao"
            type="date"
            value={formData.data_emissao}
            onChange={(e) => handleChange('data_emissao', e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="validade_meses">Validade</Label>
          <Select
            value={formData.validade_meses}
            onValueChange={(value) => handleChange('validade_meses', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a validade" />
            </SelectTrigger>
            <SelectContent>
              {validadeMeses.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Validade</Label>
          <Input
            value={new Date(calculateDataValidade(formData.data_emissao, formData.validade_meses)).toLocaleDateString('pt-BR')}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={3}
          placeholder="Observações adicionais para o certificado"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.tipo_certificado}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gerar Certificado
        </Button>
      </div>
    </form>
  )
}
