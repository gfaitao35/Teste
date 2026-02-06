import type { Certificado } from './types'

export function generateCertificatePDF(certificado: Certificado) {
  const ordem = certificado.ordem_servico as {
    numero_os: string
    tipo_servico: string
    data_execucao: string
    tecnico_responsavel?: string
    produtos_aplicados?: string
    area_tratada?: string
    pragas_alvo?: string
    cliente?: {
      razao_social: string
      cnpj: string
      endereco?: string
      cidade?: string
      estado?: string
    }
  } | undefined

  const cliente = ordem?.cliente

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '-'
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Certificado ${certificado.numero_certificado}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .certificate {
          border: 3px double #1e40af;
          padding: 40px;
          position: relative;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          color: #64748b;
        }
        .divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #1e40af, transparent);
          margin: 20px 0;
        }
        .content {
          margin: 30px 0;
          line-height: 1.8;
        }
        .certificate-number {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .info-item {
          padding: 10px;
          background: #f8fafc;
          border-radius: 4px;
        }
        .info-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          margin-top: 4px;
        }
        .full-width {
          grid-column: span 2;
        }
        .validity {
          text-align: center;
          margin: 30px 0;
          padding: 15px;
          background: #eff6ff;
          border-radius: 8px;
        }
        .validity-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 5px;
        }
        .validity-date {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
        }
        .signature-line {
          width: 250px;
          border-top: 1px solid #1e293b;
          margin: 0 auto 10px;
        }
        .signature-name {
          font-size: 14px;
          font-weight: 500;
        }
        .signature-role {
          font-size: 12px;
          color: #64748b;
        }
        .emission-date {
          margin-top: 30px;
          font-size: 12px;
          color: #64748b;
        }
        @media print {
          body {
            padding: 0;
          }
          .certificate {
            border-width: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="title">${certificado.tipo_certificado}</div>
          <div class="subtitle">Controle Integrado de Pragas Urbanas</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="certificate-number">
          Certificado N° ${certificado.numero_certificado}
        </div>
        
        <div class="content">
          <p>Certificamos que a empresa abaixo identificada foi submetida a serviço de <strong>${ordem?.tipo_servico || '-'}</strong>, em conformidade com as normas técnicas vigentes e legislação aplicável.</p>
        </div>

        <div class="info-grid">
          <div class="info-item full-width">
            <div class="info-label">Razão Social</div>
            <div class="info-value">${cliente?.razao_social || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CNPJ</div>
            <div class="info-value">${formatCNPJ(cliente?.cnpj || '')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Ordem de Serviço</div>
            <div class="info-value">${ordem?.numero_os || '-'}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Endereço</div>
            <div class="info-value">${cliente?.endereco ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}${cliente.estado ? `/${cliente.estado}` : ''}` : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data de Execução</div>
            <div class="info-value">${ordem?.data_execucao ? formatDate(ordem.data_execucao) : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Técnico Responsável</div>
            <div class="info-value">${ordem?.tecnico_responsavel || '-'}</div>
          </div>
          ${ordem?.area_tratada ? `
          <div class="info-item">
            <div class="info-label">Área Tratada</div>
            <div class="info-value">${ordem.area_tratada}</div>
          </div>
          ` : ''}
          ${ordem?.pragas_alvo ? `
          <div class="info-item">
            <div class="info-label">Pragas Alvo</div>
            <div class="info-value">${ordem.pragas_alvo}</div>
          </div>
          ` : ''}
          ${ordem?.produtos_aplicados ? `
          <div class="info-item full-width">
            <div class="info-label">Produtos Aplicados</div>
            <div class="info-value">${ordem.produtos_aplicados}</div>
          </div>
          ` : ''}
        </div>

        <div class="validity">
          <div class="validity-label">Válido até</div>
          <div class="validity-date">${formatDate(certificado.data_validade)}</div>
        </div>

        ${certificado.observacoes ? `
        <div class="content">
          <p><strong>Observações:</strong> ${certificado.observacoes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <div class="signature-line"></div>
          <div class="signature-name">Responsável Técnico</div>
          <div class="signature-role">Controlador de Pragas</div>
          <div class="emission-date">
            Emitido em ${formatDate(certificado.data_emissao)}
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
