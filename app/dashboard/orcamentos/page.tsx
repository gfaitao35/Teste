'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus, FileDown, Pencil, Trash2, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Componente do formulário (vamos definir abaixo)
import OrcamentoFormModal from '@/components/orcamento-form-modal'

type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado'

// ... statusLabels e statusVariant iguais ao anterior ...

// Armazenamento temporário (migre para API + seu DB depois)
let orcamentosStore: any[] = []

export default function OrcamentosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orcamentos, setOrcamentos] = useState<any[]>(orcamentosStore)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [openModal, setOpenModal] = useState(false)
  const [editingOrc, setEditingOrc] = useState<any | null>(null)

  // ... filtered logic igual ao anterior ...

  const handleOpenNew = () => {
    setEditingOrc(null)
    setOpenModal(true)
  }

  const handleOpenEdit = (orc: any) => {
    setEditingOrc(orc)
    setOpenModal(true)
  }

  const handleSaveFromModal = (newOrc: any) => {
    // Lógica de save (temporária)
    if (editingOrc) {
      setOrcamentos(prev => prev.map(o => o.id === newOrc.id ? newOrc : o))
    } else {
      setOrcamentos(prev => [...prev, { ...newOrc, id: crypto.randomUUID() }])
    }
    setOpenModal(false)
    toast({ title: 'Orçamento salvo com sucesso!' })
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie suas propostas comerciais</p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      {/* Filtros e tabela (igual ao anterior) */}
      {/* ... insira aqui a parte de filtros e tabela ... */}

      {/* Modal de criação/edição */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">
              {editingOrc ? `Editar Orçamento #${editingOrc.numero}` : 'Novo Orçamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6">
            <OrcamentoFormModal
              initialData={editingOrc}
              onSave={handleSaveFromModal}
              onCancel={() => setOpenModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}