import type { OrdemServico } from './types'
import type { Cliente } from './types'

export function generateOrderPDF(ordem: OrdemServico) {
  const cliente = ordem.cliente as Partial<Cliente> | undefined

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

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

  const statusLabel: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Serviço ${ordem.numero_os}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Times New Roman', Times, serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .document {
          border: 2px solid #1e40af;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #1e40af, transparent);
          margin: 20px 0;
        }
        .os-number {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin: 16px 0 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
          margin: 12px 0;
        }
        .item { }
        .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 14px; margin-top: 2px; color: #1e293b; }
        .full { grid-column: span 2; }
        .footer {
          margin-top: 40px;
          text-align: center;
        }
        .signature-line {
          width: 220px;
          border-top: 1px solid #1e293b;
          margin: 0 auto 8px;
        }
        .signature-name { font-size: 13px; font-weight: 500; }
        .signature-role { font-size: 11px; color: #64748b; }
        @media print {
          body { padding: 0; }
          .document { border-width: 1px; }
        }
      </style>
    </head>
    <body>
      <div class="document">
        <div class="header">
          <div class="title">Ordem de Serviço</div>
          <div class="subtitle">Controle de Serviços e Execução</div>
        </div>
        <div class="divider"></div>
        <div class="os-number">${ordem.numero_os}</div>

        <div class="section-title">Dados do Cliente</div>
        <div class="grid">
          <div class="item full">
            <div class="label">Razão Social</div>
            <div class="value">${cliente?.razao_social ?? '-'}</div>
          </div>
          <div class="item">
            <div class="label">Nome Fantasia</div>
            <div class="value">${cliente?.nome_fantasia ?? '-'}</div>
          </div>
          <div class="item">
            <div class="label">CNPJ</div>
            <div class="value">${formatCNPJ(cliente?.cnpj ?? '')}</div>
          </div>
          <div class="item full">
            <div class="label">Endereço</div>
            <div class="value">${cliente?.endereco ? `${cliente.endereco}${cliente.cidade ? `, ${cliente.cidade}` : ''}${cliente.estado ? ` / ${cliente.estado}` : ''}` : '-'}</div>
          </div>
          <div class="item">
            <div class="label">Telefone</div>
            <div class="value">${cliente?.telefone ?? '-'}</div>
          </div>
          <div class="item">
            <div class="label">E-mail</div>
            <div class="value">${cliente?.email ?? '-'}</div>
          </div>
        </div>

        <div class="section-title">Dados do Serviço</div>
        <div class="grid">
          <div class="item">
            <div class="label">Tipo de Serviço</div>
            <div class="value">${ordem.tipo_servico}</div>
          </div>
          <div class="item">
            <div class="label">Data de Execução</div>
            <div class="value">${ordem.data_execucao ? formatDate(ordem.data_execucao) : '-'}</div>
          </div>
          <div class="item">
            <div class="label">Status</div>
            <div class="value">${statusLabel[ordem.status] ?? ordem.status}</div>
          </div>
          <div class="item">
            <div class="label">Valor</div>
            <div class="value">${formatCurrency(ordem.valor)}</div>
          </div>
          <div class="item">
            <div class="label">Técnico Responsável</div>
            <div class="value">${ordem.tecnico_responsavel ?? '-'}</div>
          </div>
          <div class="item">
            <div class="label">Local de Execução</div>
            <div class="value">${ordem.local_execucao ?? '-'}</div>
          </div>
          ${ordem.area_tratada ? `
          <div class="item">
            <div class="label">Área Tratada</div>
            <div class="value">${ordem.area_tratada}</div>
          </div>
          ` : ''}
          ${ordem.pragas_alvo ? `
          <div class="item">
            <div class="label">Pragas Alvo</div>
            <div class="value">${ordem.pragas_alvo}</div>
          </div>
          ` : ''}
          <div class="item full">
            <div class="label">Descrição do Serviço</div>
            <div class="value">${ordem.descricao_servico ?? '-'}</div>
          </div>
          ${ordem.produtos_aplicados ? `
          <div class="item full">
            <div class="label">Produtos Aplicados</div>
            <div class="value">${ordem.produtos_aplicados}</div>
          </div>
          ` : ''}
          ${ordem.equipamentos_utilizados ? `
          <div class="item full">
            <div class="label">Equipamentos Utilizados</div>
            <div class="value">${ordem.equipamentos_utilizados}</div>
          </div>
          ` : ''}
          ${ordem.observacoes ? `
          <div class="item full">
            <div class="label">Observações</div>
            <div class="value">${ordem.observacoes}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="signature-line"></div>
          <div class="signature-name">Responsável pelo Serviço</div>
          <div class="signature-role">Controle de Pragas</div>
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
