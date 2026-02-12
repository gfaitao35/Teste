import type { Certificado } from './types'

interface TemplateStyle {
  nome_empresa: string
  subtitulo_empresa: string
  logo_url: string
  cor_primaria: string
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
  nome_empresa: '',
  subtitulo_empresa: 'Controle Integrado de Pragas Urbanas',
  logo_url: '',
  cor_primaria: '#1e40af',
  cor_texto: '#1e293b',
  fonte_familia: "'Times New Roman', Times, serif",
  fonte_tamanho: 12,
  mostrar_borda: true,
  estilo_borda: 'double',
  texto_rodape: '',
  texto_assinatura: '',
  nome_assinatura: 'Responsavel Tecnico',
  cargo_assinatura: 'Controlador de Pragas',
}

async function fetchTemplate(): Promise<TemplateStyle> {
  try {
    const res = await fetch('/api/templates?tipo=certificado')
    if (res.ok) {
      const t = await res.json()
      if (t) {
        return {
          nome_empresa: t.nome_empresa || '',
          subtitulo_empresa: t.subtitulo_empresa || defaultStyle.subtitulo_empresa,
          logo_url: t.logo_url || '',
          cor_primaria: t.cor_primaria || defaultStyle.cor_primaria,
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

export async function generateCertificatePDF(certificado: Certificado) {
  const s = await fetchTemplate()

  const ordem = certificado.ordem_servico as {
    numero_os: string; tipo_servico: string; data_execucao: string
    tecnico_responsavel?: string; produtos_aplicados?: string; area_tratada?: string; pragas_alvo?: string
    cliente?: { razao_social: string; cnpj: string; endereco?: string; cidade?: string; estado?: string }
  } | undefined

  const cliente = ordem?.cliente
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const formatCNPJ = (cnpj: string) => { if (!cnpj) return '-'; return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') }

  const borderCss = s.mostrar_borda ? `border: ${s.estilo_borda === 'double' ? '3px' : '2px'} ${s.estilo_borda} ${s.cor_primaria};` : ''

  const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Certificado ${certificado.numero_certificado}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:${s.fonte_familia};padding:40px;max-width:800px;margin:0 auto;font-size:${s.fonte_tamanho}px;color:${s.cor_texto}}
  .certificate{${borderCss}padding:40px;position:relative}
  .header{text-align:center;margin-bottom:30px}
  .logo{max-height:60px;margin-bottom:8px}
  .title{font-size:28px;font-weight:bold;color:${s.cor_primaria};text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
  .subtitle{font-size:14px;color:#64748b}
  .divider{height:2px;background:linear-gradient(to right,transparent,${s.cor_primaria},transparent);margin:20px 0}
  .content{margin:30px 0;line-height:1.8}
  .certificate-number{text-align:center;font-size:16px;font-weight:bold;color:${s.cor_primaria};margin-bottom:20px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:20px 0}
  .info-item{padding:10px;background:#f8fafc;border-radius:4px}
  .info-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
  .info-value{font-size:14px;font-weight:500;margin-top:4px}
  .full-width{grid-column:span 2}
  .validity{text-align:center;margin:30px 0;padding:15px;background:#eff6ff;border-radius:8px}
  .validity-label{font-size:12px;color:#64748b;margin-bottom:5px}
  .validity-date{font-size:18px;font-weight:bold;color:${s.cor_primaria}}
  .footer{margin-top:50px;text-align:center}
  .signature-line{width:250px;border-top:1px solid ${s.cor_texto};margin:0 auto 10px}
  .signature-name{font-size:14px;font-weight:500}
  .signature-role{font-size:12px;color:#64748b}
  .emission-date{margin-top:30px;font-size:12px;color:#64748b}
  .rodape{margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:0}.certificate{border-width:2px}}
</style></head><body><div class="certificate">
  <div class="header">
    ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" class="logo" crossorigin="anonymous" />` : ''}
    <div class="title">${certificado.tipo_certificado}</div>
    <div class="subtitle">${s.subtitulo_empresa}</div>
  </div>
  <div class="divider"></div>
  <div class="certificate-number">Certificado N. ${certificado.numero_certificado}</div>
  <div class="content">
    <p>Certificamos que a empresa abaixo identificada foi submetida a servico de <strong>${ordem?.tipo_servico || '-'}</strong>, em conformidade com as normas tecnicas vigentes e legislacao aplicavel.</p>
  </div>
  <div class="info-grid">
    <div class="info-item full-width"><div class="info-label">Razao Social</div><div class="info-value">${cliente?.razao_social || '-'}</div></div>
    <div class="info-item"><div class="info-label">CNPJ</div><div class="info-value">${formatCNPJ(cliente?.cnpj || '')}</div></div>
    <div class="info-item"><div class="info-label">Ordem de Servico</div><div class="info-value">${ordem?.numero_os || '-'}</div></div>
    <div class="info-item full-width"><div class="info-label">Endereco</div><div class="info-value">${cliente?.endereco ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}${cliente.estado ? `/${cliente.estado}` : ''}` : '-'}</div></div>
    <div class="info-item"><div class="info-label">Data de Execucao</div><div class="info-value">${ordem?.data_execucao ? formatDate(ordem.data_execucao) : '-'}</div></div>
    <div class="info-item"><div class="info-label">Tecnico Responsavel</div><div class="info-value">${ordem?.tecnico_responsavel || '-'}</div></div>
    ${ordem?.area_tratada ? `<div class="info-item"><div class="info-label">Area Tratada</div><div class="info-value">${ordem.area_tratada}</div></div>` : ''}
    ${ordem?.pragas_alvo ? `<div class="info-item"><div class="info-label">Pragas Alvo</div><div class="info-value">${ordem.pragas_alvo}</div></div>` : ''}
    ${ordem?.produtos_aplicados ? `<div class="info-item full-width"><div class="info-label">Produtos Aplicados</div><div class="info-value">${ordem.produtos_aplicados}</div></div>` : ''}
  </div>
  <div class="validity"><div class="validity-label">Valido ate</div><div class="validity-date">${formatDate(certificado.data_validade)}</div></div>
  ${certificado.observacoes ? `<div class="content"><p><strong>Observacoes:</strong> ${certificado.observacoes}</p></div>` : ''}
  <div class="footer">
    ${s.texto_assinatura ? `<p style="font-size:11px;color:#64748b;margin-bottom:16px">${s.texto_assinatura}</p>` : ''}
    <div class="signature-line"></div>
    <div class="signature-name">${s.nome_assinatura}</div>
    <div class="signature-role">${s.cargo_assinatura}</div>
    <div class="emission-date">Emitido em ${formatDate(certificado.data_emissao)}</div>
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
