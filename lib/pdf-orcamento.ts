import type { Orcamento } from '@/types/orcamento'  // ajuste o path se necessário
import { formatDateBRFromYYYYMMDD } from '@/lib/utils'

interface TemplateStyle {
  nome_empresa: string
  subtitulo_empresa: string
  logo_url: string
  cor_primaria: string
  cor_secundaria: string   // adicionei, pois OS usa
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
  nome_empresa: 'Orçamento de Serviços',
  subtitulo_empresa: 'Proposta Comercial',
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
  nome_assinatura: 'Responsável Comercial',
  cargo_assinatura: 'Consultor Técnico',
}

async function fetchTemplate(): Promise<TemplateStyle> {
  try {
    // Prioriza 'orcamento', fallback para 'os'
    let res = await fetch('/api/templates?tipo=orcamento')
    if (!res.ok || !(await res.json())) {
      res = await fetch('/api/templates?tipo=os')
    }
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

export async function generateOrcamentoPDF(orcamento: Orcamento) {
  const s = await fetchTemplate()

  const formatDate = (dateString: string) => formatDateBRFromYYYYMMDD(dateString, { day: '2-digit', month: 'long', year: 'numeric' })
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const borderCss = s.mostrar_borda
    ? `border: ${s.estilo_borda === 'double' ? '3px' : '2px'} ${s.estilo_borda} ${s.cor_primaria};`
    : ''

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento ${orcamento.numero.toString().padStart(5, '0')}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:${s.fonte_familia};padding:40px;max-width:800px;margin:0 auto;font-size:${s.fonte_tamanho}px;color:${s.cor_texto}}
    .document{${borderCss}padding:40px}
    .header{text-align:center;margin-bottom:24px}
    .logo{max-height:80px;margin-bottom:12px}
    .title{font-size:26px;font-weight:bold;color:${s.cor_primaria};text-transform:uppercase;letter-spacing:1px}
    .subtitle{font-size:14px;color:${s.cor_secundaria};margin-top:6px}
    .divider{height:2px;background:linear-gradient(to right,transparent,${s.cor_primaria},transparent);margin:20px 0}
    .doc-number{text-align:center;font-size:20px;font-weight:bold;color:${s.cor_primaria};margin-bottom:24px}
    .section-title{font-size:16px;font-weight:bold;color:${s.cor_primaria};margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin:12px 0}
    .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
    .value{font-size:14px;margin-top:2px}
    .full{grid-column:span 2}
    .total-value{font-size:20px;font-weight:bold;color:${s.cor_primaria};text-align:right;margin:20px 0}
    .list{margin-left:20px;list-style-type:disc}
    .footer{margin-top:50px;text-align:center}
    .signature-line{width:240px;border-top:1px solid ${s.cor_texto};margin:0 auto 10px}
    .signature-name{font-size:14px;font-weight:500}
    .signature-role{font-size:12px;color:#64748b}
    .rodape{margin-top:24px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    @media print{body{padding:0}.document{border-width:1px}}
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" class="logo" crossorigin="anonymous" />` : ''}
      <div class="title">ORÇAMENTO</div>
      <div class="subtitle">${s.subtitulo_empresa}</div>
    </div>
    <div class="divider"></div>
    <div class="doc-number">Nº ${orcamento.numero.toString().padStart(5, '0')}</div>

    <div class="section-title">Dados do Cliente</div>
    <div class="grid">
      <div class="full"><div class="label">Nome / Razão Social</div><div class="value">${orcamento.cliente.nome || '-'}</div></div>
      <div><div class="label">Contato / Telefone</div><div class="value">${orcamento.cliente.contato || '-'}</div></div>
      <div class="full"><div class="label">Endereço</div><div class="value">${orcamento.cliente.endereco || '-'}${orcamento.cliente.cidade ? `, ${orcamento.cliente.cidade}` : ''}</div></div>
    </div>

    <div class="section-title">${orcamento.tituloServico || 'Descrição do Serviço / Procedimentos'}</div>
    ${orcamento.procedimentos.map(p => `
      <div style="margin-bottom:16px;">
        <strong style="font-size:15px;color:${s.cor_secundaria}">${p.titulo || 'Procedimento'}</strong>
        <p style="margin-top:6px; white-space:pre-wrap;">${p.descricao || '-'}</p>
      </div>
    `).join('')}

    <div class="section-title">Garantia</div>
    <p>${orcamento.garantia || '-'}</p>

    <div class="section-title">Investimento Total</div>
    <div class="total-value">${formatCurrency(orcamento.valorInvestimento)}</div>

    <div class="section-title">Formas de Pagamento</div>
    <ul class="list">
      ${orcamento.formasPagamento.map(fp => `<li>${fp}</li>`).join('')}
    </ul>

    <div class="section-title">Considerações Finais</div>
    <ul class="list">
      ${orcamento.consideracoes.map(c => `<li>${c}</li>`).join('')}
    </ul>

    <div class="section-title">Validade</div>
    <p>Orçamento emitido em ${formatDate(orcamento.data)} • Válido por ${orcamento.diasValidade} dias</p>

    <div class="footer">
      ${s.texto_assinatura ? `<p style="font-size:11px;color:#64748b;margin-bottom:16px">${s.texto_assinatura}</p>` : ''}
      <div class="signature-line"></div>
      <div class="signature-name">${s.nome_assinatura}</div>
      <div class="signature-role">${s.cargo_assinatura}</div>
    </div>

    ${s.texto_rodape ? `<div class="rodape">${s.texto_rodape}</div>` : ''}
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => { printWindow.print() }
  }
}