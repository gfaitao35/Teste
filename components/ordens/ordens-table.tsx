'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteOrdemAction } from '@/app/dashboard/ordens/actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OrdemForm } from './ordem-form'
import { MoreHorizontal, Pencil, Trash2, Search, ClipboardList, Award, FileDown, Eye, Edit, Download, Printer, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { generateOrderPDF } from '@/lib/pdf-os'
import { ActionMenu } from '@/components/ui/action-menu'
import type { OrdemServico, Cliente, StatusOrdemServico } from '@/lib/types'
import { formatDateBRFromYYYYMMDD } from '@/lib/utils'

interface OrdensTableProps {
  ordens: OrdemServico[]
  clientes: Pick<Cliente, 'id' | 'razao_social' | 'nome_fantasia'>[]
}

const statusConfig: Record<StatusOrdemServico, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800' },
  concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800' },
  cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
}

export function OrdensTable({ ordens, clientes }: OrdensTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusOrdemServico | 'all'>('all')
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null)
  const [deletingOrdem, setDeletingOrdem] = useState<OrdemServico | null>(null)

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const filteredOrdens = ordens.filter((ordem) => {
    const matchesSearch = 
      ordem.numero_os.toLowerCase().includes(search.toLowerCase()) ||
      (ordem.cliente as { razao_social: string })?.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      ordem.tipo_servico.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ordem.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handlePrintOS = async (ordem: OrdemServico) => {
    try {
      await generateOrderPDF(ordem)
      toast.success('OS enviada para impressão!')
    } catch (error) {
      toast.error('Erro ao gerar PDF para impressão')
    }
  }

  const handleDownloadPDF = async (ordem: OrdemServico) => {
    try {
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
      toast.error('Erro ao baixar PDF')
    }
  }

  const handleGenerateCertificate = (ordem: OrdemServico) => {
    router.push(`/dashboard/certificados/novo?ordem_id=${ordem.id}`)
  }

  const handleDelete = async () => {
    if (!deletingOrdem) return

    try {
      await deleteOrdemAction(deletingOrdem.id)
      toast.success('Ordem de serviço excluída com sucesso!')
      setDeletingOrdem(null)
      router.refresh()
    } catch (error) {
      toast.error('Erro ao excluir ordem de serviço')
    }
  }

  return (
    <>
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusOrdemServico | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdens.map((ordem) => {
                  const status = statusConfig[ordem.status]
                  return (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium font-mono">{ordem.numero_os}</TableCell>
                      <TableCell>
                        {(ordem.cliente as { razao_social: string } | undefined)?.razao_social || '-'}
                      </TableCell>
                      <TableCell>{ordem.tipo_servico}</TableCell>
                      <TableCell>
                        {formatDateBRFromYYYYMMDD(ordem.data_execucao)}
                      </TableCell>
                      <TableCell>{formatCurrency(ordem.valor)}</TableCell>
                      <TableCell>
                        <Badge className={status.className} variant="secondary">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ActionMenu 
                          items={[
                            {
                              label: 'Visualizar',
                              icon: <Eye className="h-4 w-4" />,
                              onClick: () => router.push(`/dashboard/ordens/${ordem.id}`)
                            },
                            {
                              label: 'Editar Visual',
                              icon: <Palette className="h-4 w-4" />,
                              onClick: () => router.push(`/dashboard/ordens/${ordem.id}?visual=1`)
                            },
                            {
                              label: 'Editar',
                              icon: <Edit className="h-4 w-4" />,
                              onClick: () => setEditingOrdem(ordem)
                            },
                            {
                              label: 'Imprimir OS',
                              icon: <Printer className="h-4 w-4" />,
                              onClick: () => handlePrintOS(ordem)
                            },
                            {
                              label: 'Baixar PDF',
                              icon: <Download className="h-4 w-4" />,
                              onClick: () => handleDownloadPDF(ordem)
                            },
                            ...(ordem.status === 'concluida' ? [{
                              label: 'Gerar Certificado',
                              icon: <Award className="h-4 w-4" />,
                              onClick: () => handleGenerateCertificate(ordem)
                            }] : []),
                            {
                              label: 'Excluir',
                              icon: <Trash2 className="h-4 w-4" />,
                              onClick: () => setDeletingOrdem(ordem),
                              variant: 'destructive'
                            }
                          ]}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </ActionMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrdens.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Nenhuma ordem de serviço encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova ordem de serviço'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={!!editingOrdem} onOpenChange={() => setEditingOrdem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {editingOrdem && (
            <OrdemForm 
              ordem={editingOrdem} 
              clientes={clientes}
              onSuccess={() => {
                setEditingOrdem(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão */}
      <AlertDialog open={!!deletingOrdem} onOpenChange={() => setDeletingOrdem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem de serviço "{deletingOrdem?.numero_os}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
