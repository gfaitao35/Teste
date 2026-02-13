import type { OrdemServico } from './types'
import type { Cliente } from './types'
import type { DocumentTemplate } from './types'
import { formatDateBRFromYYYYMMDD } from './utils'

interface TemplateStyle {
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

const defaultStyle: TemplateStyle = {
  nome_empresa: 'Ordem de Servico',
  subtitulo_empresa: 'Controle de Servicos e Execucao',
  logo_url: '',
  cor_primaria: '#ea580c',
  cor_secundaria: '#f97316',
  cor_texto: '#1e293b',
  fonte_familia: "'Times New Roman', Times, serif",
  fonte_tamanho: 12,
  mostrar_borda: true,
  estilo_borda: 'solid',
  texto_rodape: '',
  texto_assinatura: '',
  nome_assinatura: 'Responsavel pelo Servico',
  cargo_assinatura: 'Controle de Pragas',
}

async function fetchTemplate(): Promise<TemplateStyle> {
  try {
    const res = await fetch('/api/templates?tipo=os')
    if (res.ok) {
      const t = await res.json()
      if (t) {
        return {
          nome_empresa: t.nome_empresa || defaultStyle.nome_empresa,
          subtitulo_empresa: t.subtitulo_empresa || defaultStyle.subtitulo_empresa,
          logo_url: t.logo_url || '',
          cor_primaria: t.cor_primaria || defaultStyle.cor_primaria,
          cor_secundaria: t.cor_secundaria || defaultStyle.cor_secundaria,
          cor_texto: t.cor_texto || defaultStyle.cor_texto,
          fonte_familia: t.fonte_familia ? `'${t.fonte_familia}', serif` : defaultStyle.fonte_familia,
          fonte_tamanho: t.fonte_tamanho || defaultStyle.fonte_tamanho,
          mostrar_borda: t.mostrar_borda === 1 || t.mostrar_borda === true,
          estilo_borda: t.estilo_borda || defaultStyle.estilo_borda,
          texto_rodape: t.texto_rodape || '',
          texto_assinatura: t.texto_assinatura || '',
          nome_assinatura: t.nome_assinatura || defaultStyle.nome_assinatura,
          cargo_assinatura: t.cargo_assinatura || defaultStyle.cargo_assinatura,
        }
      }
    }
  } catch {}
  return defaultStyle
}

export async function generateOrderPDF(ordem: OrdemServico) {
  const s = await fetchTemplate()
  const cliente = ordem.cliente as Partial<Cliente> | undefined

  const formatDate = (dateString: string) => formatDateBRFromYYYYMMDD(dateString, { day: '2-digit', month: 'long', year: 'numeric' })
  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    const n = cnpj.replace(/\D/g, '')
    if (n.length !== 14) return cnpj
    return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  const formatCurrency = (value: number | null) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  const statusLabel: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em Andamento', concluida: 'Concluida', cancelada: 'Cancelada' }

  const borderCss = s.mostrar_borda ? `border: ${s.estilo_borda === 'double' ? '3px' : '2px'} ${s.estilo_borda} ${s.cor_primaria};` : ''

  const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ordem de Servico ${ordem.numero_os}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:${s.fonte_familia};padding:40px;max-width:800px;margin:0 auto;font-size:${s.fonte_tamanho}px;color:${s.cor_texto}}
  .document{${borderCss}padding:40px}
  .header{text-align:center;margin-bottom:24px}
  .logo{max-height:60px;margin-bottom:8px}
  .title{font-size:24px;font-weight:bold;color:${s.cor_primaria};text-transform:uppercase;letter-spacing:1px}
  .subtitle{font-size:13px;color:${s.cor_primaria};margin-top:4px}
  .divider{height:2px;background:linear-gradient(to right,transparent,${s.cor_primaria},transparent);margin:20px 0}
  .os-number{text-align:center;font-size:18px;font-weight:bold;color:${s.cor_primaria};margin-bottom:20px}
  .section-title{font-size:14px;font-weight:bold;color:${s.cor_primaria};margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin:12px 0}
  .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
  .value{font-size:14px;margin-top:2px}
  .full{grid-column:span 2}
  .footer{margin-top:40px;text-align:center}
  .signature-line{width:220px;border-top:1px solid ${s.cor_texto};margin:0 auto 8px}
  .signature-name{font-size:13px;font-weight:500}
  .signature-role{font-size:11px;color:#64748b}
  .rodape{margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:0}.document{border-width:1px}}
</style></head><body><div class="document">
  <div class="header">
    ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" class="logo" crossorigin="anonymous" />` : ''}
    <div class="title">${s.nome_empresa}</div>
    <div class="subtitle">${s.subtitulo_empresa}</div>
  </div>
  <div class="divider"></div>
  <div class="os-number">${ordem.numero_os}</div>
  <div class="section-title">Dados do Cliente</div>
  <div class="grid">
    <div class="full"><div class="label">Razao Social</div><div class="value">${cliente?.razao_social ?? '-'}</div></div>
    <div><div class="label">Nome Fantasia</div><div class="value">${cliente?.nome_fantasia ?? '-'}</div></div>
    <div><div class="label">CNPJ</div><div class="value">${formatCNPJ(cliente?.cnpj ?? '')}</div></div>
    <div class="full"><div class="label">Endereco</div><div class="value">${cliente?.endereco ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}${cliente.estado ? ` / ${cliente.estado}` : ''}` : '-'}</div></div>
    <div><div class="label">Telefone</div><div class="value">${cliente?.telefone ?? '-'}</div></div>
    <div><div class="label">E-mail</div><div class="value">${cliente?.email ?? '-'}</div></div>
  </div>
  <div class="section-title">Dados do Servico</div>
  <div class="grid">
    <div><div class="label">Tipo de Servico</div><div class="value">${ordem.tipo_servico}</div></div>
    <div><div class="label">Data de Execucao</div><div class="value">${ordem.data_execucao ? formatDate(ordem.data_execucao) : '-'}</div></div>
    <div><div class="label">Status</div><div class="value">${statusLabel[ordem.status] ?? ordem.status}</div></div>
    <div><div class="label">Valor</div><div class="value">${formatCurrency(ordem.valor)}</div></div>
    <div><div class="label">Tecnico Responsavel</div><div class="value">${ordem.tecnico_responsavel ?? '-'}</div></div>
    <div><div class="label">Local de Execucao</div><div class="value">${ordem.local_execucao ?? '-'}</div></div>
    ${ordem.area_tratada ? `<div><div class="label">Area Tratada</div><div class="value">${ordem.area_tratada}</div></div>` : ''}
    ${ordem.pragas_alvo ? `<div><div class="label">Pragas Alvo</div><div class="value">${ordem.pragas_alvo}</div></div>` : ''}
    <div class="full"><div class="label">Descricao do Servico</div><div class="value">${ordem.descricao_servico ?? '-'}</div></div>
    ${ordem.produtos_aplicados ? `<div class="full"><div class="label">Produtos Aplicados</div><div class="value">${ordem.produtos_aplicados}</div></div>` : ''}
    ${ordem.equipamentos_utilizados ? `<div class="full"><div class="label">Equipamentos Utilizados</div><div class="value">${ordem.equipamentos_utilizados}</div></div>` : ''}
    ${ordem.observacoes ? `<div class="full"><div class="label">Observacoes</div><div class="value">${ordem.observacoes}</div></div>` : ''}
  </div>
  <div class="section-title">Condicoes de Garantia</div>
  <div class="grid">
    <div><div class="label">Garantia</div><div class="value">${ordem.garantia_meses != null ? `${ordem.garantia_meses} mes(es)` : '-'}</div></div>
    <div><div class="label">Visitas Gratuitas</div><div class="value">${typeof ordem.visitas_gratuitas === 'number' ? ordem.visitas_gratuitas : 0}</div></div>
  </div>
  <div class="footer">
    ${s.texto_assinatura ? `<p style="font-size:11px;color:#64748b;margin-bottom:16px">${s.texto_assinatura}</p>` : ''}
    <div class="signature-line"></div>
    <div class="signature-name">${s.nome_assinatura}</div>
    <div class="signature-role">${s.cargo_assinatura}</div>
  </div>
  ${s.texto_rodape ? `<div class="rodape">${s.texto_rodape}</div>` : ''}
</div></body></html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => { printWindow.print() }
  }
}
