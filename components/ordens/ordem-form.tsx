'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrdemAction, updateOrdemAction } from '@/app/dashboard/ordens/actions'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrdemServico, Cliente, StatusOrdemServico } from '@/lib/types'

interface OrdemFormProps {
  ordem?: OrdemServico
  clientes: Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'>[]
  onSuccess?: () => void
}

const tiposServico = [
  'Dedetização',
  'Desratização',
  'Descupinização',
  'Sanitização',
  'Controle de Pragas',
  'Limpeza de Caixa D\'água',
  'Outro',
]

export function OrdemForm({ ordem, clientes, onSuccess }: OrdemFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cliente_id: ordem?.cliente_id || '',
    data_execucao: ordem?.data_execucao || new Date().toISOString().split('T')[0],
    tipo_servico: ordem?.tipo_servico || '',
    descricao_servico: ordem?.descricao_servico || '',
    local_execucao: ordem?.local_execucao || '',
    equipamentos_utilizados: ordem?.equipamentos_utilizados || '',
    produtos_aplicados: ordem?.produtos_aplicados || '',
    area_tratada: ordem?.area_tratada || '',
    pragas_alvo: ordem?.pragas_alvo || '',
    tecnico_responsavel: ordem?.tecnico_responsavel || '',
    status: (ordem?.status || 'pendente') as StatusOrdemServico,
    valor: ordem?.valor?.toString() || '',
    garantia_meses: ordem?.garantia_meses?.toString() || '',
    visitas_gratuitas: ordem?.visitas_gratuitas?.toString() || '0',
    observacoes: ordem?.observacoes || '',
  })

  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateNumeroOS = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `OS-${year}${month}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      cliente_id: formData.cliente_id,
      data_execucao: formData.data_execucao,
      tipo_servico: formData.tipo_servico,
      descricao_servico: formData.descricao_servico || null,
      local_execucao: formData.local_execucao || null,
      equipamentos_utilizados: formData.equipamentos_utilizados || null,
      produtos_aplicados: formData.produtos_aplicados || null,
      area_tratada: formData.area_tratada || null,
      pragas_alvo: formData.pragas_alvo || null,
      tecnico_responsavel: formData.tecnico_responsavel || null,
      status: formData.status,
      valor: formData.valor ? parseFloat(formData.valor) : null,
      garantia_meses: formData.garantia_meses ? parseInt(formData.garantia_meses) : null,
      visitas_gratuitas: formData.visitas_gratuitas ? parseInt(formData.visitas_gratuitas) : 0,
      observacoes: formData.observacoes || null,
    }

    if (ordem) {
      const result = await updateOrdemAction(ordem.id, data)
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }
      toast.success('Ordem de serviço atualizada com sucesso')
    } else {
      const result = await createOrdemAction({
        ...data,
        numero_os: generateNumeroOS(),
      })
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }
      toast.success('Ordem de serviço criada com sucesso')
    }

    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select
            value={formData.cliente_id}
            onValueChange={(value) => handleChange('cliente_id', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.razao_social}
                  {cliente.nome_fantasia && ` (${cliente.nome_fantasia})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_execucao">Data de Execução *</Label>
          <Input
            id="data_execucao"
            type="date"
            value={formData.data_execucao}
            onChange={(e) => handleChange('data_execucao', e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
          <Select
            value={formData.tipo_servico}
            onValueChange={(value) => handleChange('tipo_servico', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposServico.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange('status', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao_servico">Descrição do Serviço</Label>
        <Textarea
          id="descricao_servico"
          value={formData.descricao_servico}
          onChange={(e) => handleChange('descricao_servico', e.target.value)}
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="local_execucao">Local de Execução</Label>
          <Input
            id="local_execucao"
            value={formData.local_execucao}
            onChange={(e) => handleChange('local_execucao', e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_tratada">Área Tratada</Label>
          <Input
            id="area_tratada"
            value={formData.area_tratada}
            onChange={(e) => handleChange('area_tratada', e.target.value)}
            placeholder="Ex: 500m²"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pragas_alvo">Pragas Alvo</Label>
          <Input
            id="pragas_alvo"
            value={formData.pragas_alvo}
            onChange={(e) => handleChange('pragas_alvo', e.target.value)}
            placeholder="Ex: Baratas, Ratos, Cupins"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tecnico_responsavel">Técnico Responsável</Label>
          <Input
            id="tecnico_responsavel"
            value={formData.tecnico_responsavel}
            onChange={(e) => handleChange('tecnico_responsavel', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="produtos_aplicados">Produtos Aplicados</Label>
        <Textarea
          id="produtos_aplicados"
          value={formData.produtos_aplicados}
          onChange={(e) => handleChange('produtos_aplicados', e.target.value)}
          rows={2}
          placeholder="Liste os produtos utilizados no serviço"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipamentos_utilizados">Equipamentos Utilizados</Label>
        <Textarea
          id="equipamentos_utilizados"
          value={formData.equipamentos_utilizados}
          onChange={(e) => handleChange('equipamentos_utilizados', e.target.value)}
          rows={2}
          placeholder="Liste os equipamentos utilizados"
          disabled={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => handleChange('valor', e.target.value)}
            placeholder="0,00"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="garantia_meses">Garantia (meses)</Label>
          <Input
            id="garantia_meses"
            type="number"
            min="0"
            value={formData.garantia_meses}
            onChange={(e) => handleChange('garantia_meses', e.target.value)}
            placeholder="Ex: 6"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitas_gratuitas">Visitas Gratuitas</Label>
          <Input
            id="visitas_gratuitas"
            type="number"
            min="0"
            value={formData.visitas_gratuitas}
            onChange={(e) => handleChange('visitas_gratuitas', e.target.value)}
            placeholder="Ex: 2"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !formData.cliente_id || !formData.tipo_servico}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ordem ? 'Atualizar' : 'Criar Ordem'}
        </Button>
      </div>
    </form>
  )
}
