// app/dashboard/orcamentos/novo/page.tsx   (ou [id]/page.tsx para edição)

'use client'

import { Loader2 } from 'lucide-react'  // ← adicione isso aqui em cima
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Trash2, FileDown, Save } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Ajuste esses imports conforme seu projeto
import { generateOrcamentoPDF } from '@/lib/pdf-orcamento'  // sua função de PDF

// Tipos (copie/adapte do seu projeto ou crie um arquivo types/orcamento.ts)
type DadosEmpresa = {
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  email: string
  nomeCompleto: string
  logo?: string
}

type DadosCliente = {
  nome: string
  contato: string
  endereco: string
  cidade: string
}

type Procedimento = {
  id: string
  titulo: string
  descricao: string
}

type Orcamento = {
  id: string
  numero: number
  data: string
  status: 'rascunho' | 'enviado'
  empresa: DadosEmpresa
  cliente: DadosCliente
  tituloServico: string
  procedimentos: Procedimento[]
  garantia: string
  valorInvestimento: number
  formasPagamento: string[]
  consideracoes: string[]
  diasValidade: number
}

const newId = () => crypto.randomUUID()

const defaultConsideracoes = [
  "Orçamento válido por 10 dias após envio",
  "Procedimento realizado apenas na presença de responsável ou autorizado",
]

export default function OrcamentoForm() {
  const params = useParams()
  const id = params.id as string | undefined
  const router = useRouter()
  const { toast } = useToast()

const [empresa, setEmpresa] = useState<DadosEmpresa>({
  nomeFantasia: '',
  razaoSocial: '',
  cnpj: '',
  email: '',
  nomeCompleto: '',
  logo: '',
})

  const [loadingEmpresa, setLoadingEmpresa] = useState(true)
  const [cliente, setCliente] = useState<DadosCliente>({ nome: "", contato: "", endereco: "", cidade: "" })
  const [tituloServico, setTituloServico] = useState("")
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([
    { id: newId(), titulo: "", descricao: "" },
  ])
  const [garantia, setGarantia] = useState("06 meses")
  const [valor, setValor] = useState(0)
  const [formasPagamento, setFormasPagamento] = useState<string[]>(["À vista 5% de desconto"])
  const [consideracoes, setConsideracoes] = useState<string[]>(defaultConsideracoes)
  const [diasValidade, setDiasValidade] = useState(10)
  const [dataOrcamento, setDataOrcamento] = useState(new Date().toISOString().slice(0, 10))
  const [numero, setNumero] = useState(0)
  const [orcId, setOrcId] = useState(id || newId())

useEffect(() => {
  async function loadDadosEmpresa() {
    setLoadingEmpresa(true)
    try {
      // 1. Dados básicos do usuário (nome, razão, cnpj, email, nome_completo)
      const resUser = await fetch('/api/user/empresa')
      let userData = {}
      if (resUser.ok) {
        userData = await resUser.json()
      }

      // 2. Logo e dados visuais do template (prioriza 'orcamento' → fallback 'os')
      let logo = ''
      let nomeEmpresaFallback = '' // opcional

      // Tenta tipo 'orcamento'
      let resTemplate = await fetch('/api/templates?tipo=orcamento')
      if (resTemplate.ok) {
        const template = await resTemplate.json()
        if (template) {
          logo = template.logo_url || ''
          nomeEmpresaFallback = template.nome_empresa || ''
        }
      }

      // Fallback para 'os' se não tiver em 'orcamento'
      if (!logo) {
        resTemplate = await fetch('/api/templates?tipo=os')
        if (resTemplate.ok) {
          const templateOs = await resTemplate.json()
          if (templateOs) {
            logo = templateOs.logo_url || ''
            nomeEmpresaFallback = templateOs.nome_empresa || ''
          }
        }
      }

      setEmpresa({
        nomeFantasia: userData.nomeFantasia || nomeEmpresaFallback || '',
        razaoSocial: userData.razaoSocial || '',
        cnpj: userData.cnpj || '',
        email: userData.email || '',
        nomeCompleto: userData.nomeCompleto || '',
        logo: logo || '',
      })
    } catch (err) {
      console.error('Erro ao carregar dados da empresa:', err)
      toast({
        title: 'Não foi possível carregar dados da empresa',
        description: 'Verifique se há template configurado.',
        variant: 'destructive',
      })
    } finally {
      setLoadingEmpresa(false)
    }
  }

  loadDadosEmpresa()

    // Lógica de edição ou novo (igual ao original)
    if (id) {
      // ... sua lógica de carregar orçamento existente ...
    } else {
      setNumero(Date.now()) // ou sua função getNextNumero
    }
  }, [id, toast])

  function buildOrcamento(status: "rascunho" | "enviado" = "rascunho"): Orcamento {
    return {
      id: orcId,
      numero,
      data: dataOrcamento,
      status,
      empresa,
      cliente,
      tituloServico,
      procedimentos,
      garantia,
      valorInvestimento: valor,
      formasPagamento,
      consideracoes,
      diasValidade,
    }
  }

  function handleSave() {
    const orc = buildOrcamento()
    // Futuro: salvar via API no seu SQLite
    toast({ title: "Orçamento salvo! (implementação temporária)" })
    router.push('/dashboard/orcamentos')
  }

  function handleGerarPdf() {
    const orc = buildOrcamento()
    generateOrcamentoPDF(orc)  // ← sua função que abre print window
    toast({ title: "PDF gerado com sucesso!" })
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setEmpresa((prev) => ({ ...prev, logo: reader.result as string }))
    reader.readAsDataURL(file)
  }

  // Helpers dinâmicos (exatamente iguais)
  function addProcedimento() {
    setProcedimentos((p) => [...p, { id: newId(), titulo: "", descricao: "" }])
  }

  function removeProcedimento(pid: string) {
    setProcedimentos((p) => p.filter((x) => x.id !== pid))
  }

  function updateProcedimento(pid: string, field: keyof Procedimento, val: string) {
    setProcedimentos((p) => p.map((x) => (x.id === pid ? { ...x, [field]: val } : x)))
  }

  function addFormaPagamento() {
    setFormasPagamento((f) => [...f, ""])
  }

  function removeFormaPagamento(idx: number) {
    setFormasPagamento((f) => f.filter((_, i) => i !== idx))
  }

  function addConsideracao() {
    setConsideracoes((c) => [...c, ""])
  }

  function removeConsideracao(idx: number) {
    setConsideracoes((c) => c.filter((_, i) => i !== idx))
  }
  if (loadingEmpresa) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dados da empresa...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGerarPdf}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {id ? `Editar Orçamento #${numero}` : `Novo Orçamento #${numero}`}
        </h1>

        {/* Seção 1 - Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {empresa.logo && (
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-sm text-muted-foreground">Logo</Label>
                <img 
                  src={empresa.logo} 
                  alt="Logo da empresa" 
                  className="mt-2 max-h-24 object-contain border rounded bg-white p-2"
                />
              </div>
            )}

            <div>
              <Label className="text-sm text-muted-foreground">Nome Fantasia</Label>
              <p className="font-medium mt-1">{empresa.nomeFantasia || '—'}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Razão Social</Label>
              <p className="font-medium mt-1">{empresa.razaoSocial || '—'}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">CNPJ</Label>
              <p className="font-medium mt-1">{empresa.cnpj || '—'}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="font-medium mt-1">{empresa.email || '—'}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Responsável</Label>
              <p className="font-medium mt-1">{empresa.nomeCompleto || '—'}</p>
            </div>
          </CardContent>
        </Card>

        {/* As outras seções seguem idênticas ao seu código original */}
        {/* Cliente */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Contato / Telefone</Label>
              <Input value={cliente.contato} onChange={(e) => setCliente({ ...cliente, contato: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={cliente.endereco} onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input value={cliente.cidade} onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Serviços</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Título do Serviço</Label>
              <Input placeholder="Ex: Desinsetização, desratização..." value={tituloServico} onChange={(e) => setTituloServico(e.target.value)} />
            </div>
            <Separator />
            <Label className="text-sm font-semibold">Procedimentos</Label>
            {procedimentos.map((p, idx) => (
              <div key={p.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Procedimento {idx + 1}</span>
                  {procedimentos.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeProcedimento(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input placeholder="Título" value={p.titulo} onChange={(e) => updateProcedimento(p.id, "titulo", e.target.value)} />
                <Textarea placeholder="Descrição detalhada" value={p.descricao} onChange={(e) => updateProcedimento(p.id, "descricao", e.target.value)} rows={3} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addProcedimento}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar Procedimento
            </Button>
            <Separator />
            <div className="space-y-1">
              <Label>Garantia</Label>
              <Input value={garantia} onChange={(e) => setGarantia(e.target.value)} placeholder="Ex: 06 meses" />
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Investimento e Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Valor do Investimento (R$)</Label>
              <Input type="number" step="0.01" min={0} value={valor || ""} onChange={(e) => setValor(parseFloat(e.target.value) || 0)} />
            </div>
            <Separator />
            <Label className="text-sm font-semibold">Formas de Pagamento</Label>
            {formasPagamento.map((fp, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={fp} onChange={(e) => {
                  const copy = [...formasPagamento]
                  copy[idx] = e.target.value
                  setFormasPagamento(copy)
                }} placeholder="Ex: À vista 5% de desconto" />
                {formasPagamento.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => removeFormaPagamento(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFormaPagamento}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar Forma
            </Button>
          </CardContent>
        </Card>

        {/* Considerações */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Considerações Finais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {consideracoes.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={c} onChange={(e) => {
                  const copy = [...consideracoes]
                  copy[idx] = e.target.value
                  setConsideracoes(copy)
                }} />
                <Button size="icon" variant="ghost" onClick={() => removeConsideracao(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addConsideracao}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar Consideração
            </Button>
          </CardContent>
        </Card>

        {/* Validade */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Validade</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Data do Orçamento</Label>
              <Input type="date" value={dataOrcamento} onChange={(e) => setDataOrcamento(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Dias de Validade</Label>
              <Input type="number" min={1} value={diasValidade} onChange={(e) => setDiasValidade(parseInt(e.target.value) || 10)} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2 pb-8">
          <Button variant="outline" onClick={handleGerarPdf}>
            <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Salvar Orçamento
          </Button>
        </div>
      </div>
    </div>
  )
}