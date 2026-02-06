export type UserRole = 'admin' | 'operador'

export interface SessionUser {
  id: string
  email: string
  nome_completo: string
  role: UserRole
}

export interface Profile {
  id: string
  nome_completo: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  contato_responsavel: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export type StatusOrdemServico = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export interface OrdemServico {
  id: string
  numero_os: string
  cliente_id: string
  data_execucao: string
  tipo_servico: string
  descricao_servico: string | null
  local_execucao: string | null
  equipamentos_utilizados: string | null
  produtos_aplicados: string | null
  area_tratada: string | null
  pragas_alvo: string | null
  observacoes: string | null
  tecnico_responsavel: string | null
  status: StatusOrdemServico
  valor: number | null
  liquidado: boolean
  data_liquidacao: string | null
  valor_pago: number | null
  created_at: string
  updated_at: string
  user_id: string
  cliente?: Cliente
}

export interface Certificado {
  id: string
  ordem_servico_id: string
  numero_certificado: string
  data_emissao: string
  data_validade: string
  tipo_certificado: string
  observacoes: string | null
  created_at: string
  user_id: string
  ordem_servico?: OrdemServico
}

export interface DashboardStats {
  totalClientes: number
  ordensAtivas: number
  ordensConcluidas: number
  certificadosEmitidos: number
}
