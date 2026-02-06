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
  `)
  migrateOrdensServicoFinanceiro(database)
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
}

export { getDb }
export type { Database }
