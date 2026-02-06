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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreHorizontal, Pencil, Trash2, Search, ClipboardList, Award, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { generateOrderPDF } from '@/lib/pdf-os'
import type { OrdemServico, Cliente, StatusOrdemServico } from '@/lib/types'

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null)
  const [deletingOrdem, setDeletingOrdem] = useState<OrdemServico | null>(null)
  const router = useRouter()

  const filteredOrdens = ordens.filter((ordem) => {
    const matchesSearch =
      ordem.numero_os.toLowerCase().includes(search.toLowerCase()) ||
      ordem.tipo_servico.toLowerCase().includes(search.toLowerCase()) ||
      (ordem.cliente as { razao_social: string } | undefined)?.razao_social?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || ordem.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async () => {
    if (!deletingOrdem) return
    const result = await deleteOrdemAction(deletingOrdem.id)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Ordem de serviço excluída com sucesso')
    setDeletingOrdem(null)
    router.refresh()
  }

  const handleGenerateCertificate = (ordem: OrdemServico) => {
    router.push(`/dashboard/certificados/novo?ordem_id=${ordem.id}`)
  }

  const handlePrintOS = (ordem: OrdemServico) => {
    generateOrderPDF(ordem)
    toast.success('Impressão da OS aberta')
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, tipo de serviço ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
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

          {filteredOrdens.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Serviço</TableHead>
                    <TableHead>Data Execução</TableHead>
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
                          {new Date(ordem.data_execucao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{formatCurrency(ordem.valor)}</TableCell>
                        <TableCell>
                          <Badge className={status.className} variant="secondary">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrintOS(ordem)}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Imprimir OS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingOrdem(ordem)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {ordem.status === 'concluida' && (
                                <DropdownMenuItem onClick={() => handleGenerateCertificate(ordem)}>
                                  <Award className="mr-2 h-4 w-4" />
                                  Gerar Certificado
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeletingOrdem(ordem)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
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

      <Dialog open={!!editingOrdem} onOpenChange={() => setEditingOrdem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {editingOrdem && (
            <OrdemForm
              ordem={editingOrdem}
              clientes={clientes}
              onSuccess={() => setEditingOrdem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingOrdem} onOpenChange={() => setDeletingOrdem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem de serviço{' '}
              <strong>{deletingOrdem?.numero_os}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
