import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'app.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs')
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    initSchema(db)
  }
  return db
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nome_completo TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin', 'operador')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      razao_social TEXT NOT NULL,
      nome_fantasia TEXT,
      cnpj TEXT NOT NULL,
      endereco TEXT,
      cidade TEXT,
      estado TEXT,
      cep TEXT,
      telefone TEXT,
      email TEXT,
      contato_responsavel TEXT,
      observacoes TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);

    CREATE TABLE IF NOT EXISTS ordens_servico (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      numero_os TEXT NOT NULL,
      data_execucao TEXT NOT NULL,
      tipo_servico TEXT NOT NULL,
      descricao_servico TEXT,
      local_execucao TEXT,
      equipamentos_utilizados TEXT,
      produtos_aplicados TEXT,
      area_tratada TEXT,
      pragas_alvo TEXT,
      observacoes TEXT,
      tecnico_responsavel TEXT,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
      valor REAL,
      liquidado INTEGER NOT NULL DEFAULT 0,
      data_liquidacao TEXT,
      valor_pago REAL,
      garantia_meses INTEGER,
      visitas_gratuitas INTEGER DEFAULT 0,
      contrato_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_os_user_id ON ordens_servico(user_id);
    CREATE INDEX IF NOT EXISTS idx_os_cliente_id ON ordens_servico(cliente_id);

    CREATE TABLE IF NOT EXISTS certificados (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ordem_servico_id TEXT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      numero_certificado TEXT NOT NULL,
      data_emissao TEXT NOT NULL,
      data_validade TEXT NOT NULL,
      tipo_certificado TEXT NOT NULL,
      observacoes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cert_user_id ON certificados(user_id);
    CREATE INDEX IF NOT EXISTS idx_cert_os_id ON certificados(ordem_servico_id);

    CREATE TABLE IF NOT EXISTS contratos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      numero_contrato TEXT NOT NULL UNIQUE,
      data_inicio TEXT NOT NULL,
      data_fim TEXT NOT NULL,
      valor_total REAL NOT NULL,
      numero_parcelas INTEGER NOT NULL,
      valor_parcela REAL NOT NULL,
      dia_vencimento INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado', 'concluido')),
      observacoes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contratos_user_id ON contratos(user_id);
    CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos(cliente_id);

    CREATE TABLE IF NOT EXISTS parcelas (
      id TEXT PRIMARY KEY,
      contrato_id TEXT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
      numero_parcela INTEGER NOT NULL,
      valor_parcela REAL NOT NULL,
      data_vencimento TEXT NOT NULL,
      data_pagamento TEXT,
      valor_pago REAL,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada', 'cancelada')),
      forma_pagamento TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_parcelas_contrato_id ON parcelas(contrato_id);
    CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);
  `)
  migrateOrdensServicoFinanceiro(database)
  migrateDocumentTemplates(database)
  migrateLancamentosFinanceiros(database)
}

function migrateDocumentTemplates(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS document_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('os', 'certificado')),
      nome_empresa TEXT,
      subtitulo_empresa TEXT,
      logo_url TEXT,
      cor_primaria TEXT DEFAULT '#1e40af',
      cor_secundaria TEXT DEFAULT '#3b82f6',
      cor_texto TEXT DEFAULT '#1f2937',
      fonte_familia TEXT DEFAULT 'Arial',
      fonte_tamanho INTEGER DEFAULT 12,
      mostrar_borda INTEGER DEFAULT 1,
      estilo_borda TEXT DEFAULT 'solid',
      texto_rodape TEXT,
      texto_assinatura TEXT,
      nome_assinatura TEXT,
      cargo_assinatura TEXT,
      campos_visiveis TEXT DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_user_tipo ON document_templates(user_id, tipo);
  `)
}

function migrateLancamentosFinanceiros(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS categorias_financeiras (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
      cor TEXT DEFAULT '#6b7280',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias_financeiras(user_id);

    CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
      categoria_id TEXT REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data_lancamento TEXT NOT NULL,
      data_pagamento TEXT,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
      forma_pagamento TEXT,
      referencia_tipo TEXT CHECK (referencia_tipo IN ('os', 'contrato', 'manual')),
      referencia_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos_financeiros(user_id);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos_financeiros(tipo);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos_financeiros(status);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_financeiros(data_lancamento);
  `)
}

function migrateOrdensServicoFinanceiro(database: Database.Database) {
  const info = database.prepare("SELECT name FROM pragma_table_info('ordens_servico')").all() as { name: string }[]
  const hasLiquidado = info.some((c) => c.name === 'liquidado')
  if (!hasLiquidado) {
    database.exec(`
      ALTER TABLE ordens_servico ADD COLUMN liquidado INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE ordens_servico ADD COLUMN data_liquidacao TEXT;
      ALTER TABLE ordens_servico ADD COLUMN valor_pago REAL;
    `)
  }
  
  const hasGarantia = info.some((c) => c.name === 'garantia_meses')
  if (!hasGarantia) {
    database.exec(`
      ALTER TABLE ordens_servico ADD COLUMN garantia_meses INTEGER;
      ALTER TABLE ordens_servico ADD COLUMN visitas_gratuitas INTEGER DEFAULT 0;
      ALTER TABLE ordens_servico ADD COLUMN contrato_id TEXT;
    `)
  }
}

export { getDb }
export type { Database }
