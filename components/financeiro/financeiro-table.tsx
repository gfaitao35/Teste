'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { liquidarOrdemAction, desfazerLiquidacaoAction } from '@/app/dashboard/ordens/actions'
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
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, XCircle, FileDown, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { generateOrderPDF } from '@/lib/pdf-os'
import type { OrdemServico } from '@/lib/types'
import { toLocalDateInput, formatDateBRFromYYYYMMDD } from '@/lib/utils'

interface FinanceiroTableProps {
  ordens: OrdemServico[]
}

export function FinanceiroTable({ ordens }: FinanceiroTableProps) {
  const [filter, setFilter] = useState<string>('all')
  const [liquidandoOrdem, setLiquidandoOrdem] = useState<OrdemServico | null>(null)
  const [dataLiquidacao, setDataLiquidacao] = useState(() => toLocalDateInput())
  const [valorPago, setValorPago] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [desfazendoOrdem, setDesfazendoOrdem] = useState<OrdemServico | null>(null)
  const router = useRouter()

  const filteredOrdens = ordens.filter((o) => {
    if (filter === 'pendentes') return !o.liquidado
    if (filter === 'liquidados') return o.liquidado
    return true
  })

  const formatCurrency = (value: number | null) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateStr: string | null) => formatDateBRFromYYYYMMDD(dateStr)

  const handleOpenLiquidar = (ordem: OrdemServico) => {
    setLiquidandoOrdem(ordem)
    setDataLiquidacao(toLocalDateInput())
    setValorPago(ordem.valor != null ? String(ordem.valor) : '')
  }

  const handleLiquidar = async () => {
    if (!liquidandoOrdem) return
    setLoading(true)
    const result = await liquidarOrdemAction(liquidandoOrdem.id, {
      data_liquidacao: dataLiquidacao,
      valor_pago: valorPago ? parseFloat(valorPago) : liquidandoOrdem.valor,
    })
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('OS liquidada com sucesso')
    setLiquidandoOrdem(null)
    router.refresh()
  }

  const handleDesfazer = async () => {
    if (!desfazendoOrdem) return
    const result = await desfazerLiquidacaoAction(desfazendoOrdem.id)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Liquidação desfeita')
    setDesfazendoOrdem(null)
    router.refresh()
  }

  const handlePrintOS = async (ordem: OrdemServico) => {
    await generateOrderPDF(ordem)
    toast.success('Impressão da OS aberta')
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="liquidados">Liquidadas</SelectItem>
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
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Liquidação</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdens.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-mono font-medium">{ordem.numero_os}</TableCell>
                      <TableCell>
                        {(ordem.cliente as { razao_social?: string } | undefined)?.razao_social ?? '-'}
                      </TableCell>
                      <TableCell>{ordem.tipo_servico}</TableCell>
                      <TableCell>{formatCurrency(ordem.valor)}</TableCell>
                      <TableCell>
                        <Badge variant={ordem.liquidado ? 'default' : 'secondary'} className={ordem.liquidado ? 'bg-emerald-600' : 'bg-amber-100 text-amber-800'}>
                          {ordem.liquidado ? 'Liquidado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ordem.data_liquidacao)}</TableCell>
                      <TableCell>{ordem.liquidado ? formatCurrency(ordem.valor_pago ?? ordem.valor) : '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePrintOS(ordem)}>
                              <FileDown className="mr-2 h-4 w-4" />
                              Imprimir OS
                            </DropdownMenuItem>
                            {!ordem.liquidado ? (
                              <DropdownMenuItem onClick={() => handleOpenLiquidar(ordem)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Liquidar OS
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setDesfazendoOrdem(ordem)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Desfazer liquidação
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Nenhuma ordem encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all' ? 'Tente outro filtro.' : 'As ordens de serviço aparecem aqui para liquidação.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!liquidandoOrdem} onOpenChange={() => !loading && setLiquidandoOrdem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liquidar OS</DialogTitle>
          </DialogHeader>
          {liquidandoOrdem && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                OS <strong>{liquidandoOrdem.numero_os}</strong> – {(liquidandoOrdem.cliente as { razao_social?: string })?.razao_social} – {formatCurrency(liquidandoOrdem.valor)}
              </p>
              <div className="space-y-2">
                <Label htmlFor="data_liquidacao">Data da liquidação</Label>
                <Input
                  id="data_liquidacao"
                  type="date"
                  value={dataLiquidacao}
                  onChange={(e) => setDataLiquidacao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_pago">Valor pago (opcional)</Label>
                <Input
                  id="valor_pago"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(liquidandoOrdem.valor ?? '')}
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Deixe em branco para usar o valor da OS</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiquidandoOrdem(null)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleLiquidar} disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar liquidação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!desfazendoOrdem} onOpenChange={() => setDesfazendoOrdem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer liquidação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desfazer a liquidação da OS <strong>{desfazendoOrdem?.numero_os}</strong>? A OS voltará a aparecer como pendente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesfazer} className="bg-amber-600 hover:bg-amber-700">
              Desfazer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
