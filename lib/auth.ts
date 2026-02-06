import { createHmac, randomBytes } from 'crypto'
import { getDb } from './db'
import type { UserRole } from './types'
import type { SessionUser } from './types'

const SESSION_COOKIE = 'session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

function sign(value: string): string {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
}

export function createSessionCookie(payload: { userId: string; email: string; nome_completo: string; role: string }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  })
  const encoded = Buffer.from(data, 'utf-8').toString('base64url')
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

export function parseSessionCookie(cookieValue: string): SessionUser | null {
  try {
    const [encoded, sig] = cookieValue.split('.')
    if (!encoded || !sig || sig !== sign(encoded)) return null
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'))
    if (data.exp && data.exp < Date.now()) return null
    return {
      id: data.userId,
      email: data.email,
      nome_completo: data.nome_completo,
      role: data.role as UserRole,
    }
  } catch {
    return null
  }
}

export async function getSessionFromCookie(cookieHeader: string | undefined): Promise<SessionUser | null> {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  const value = match?.[1]?.trim()
  if (!value) return null
  return parseSessionCookie(value)
}

export { parseSessionCookie }

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  }
}

// Bcrypt será usado via import dinâmico ou dependência; para evitar native deps, usamos crypto.scrypt
export async function hashPassword(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import('crypto')
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err)
      else resolve(`${salt}:${derived.toString('hex')}`)
    })
  })
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const { scrypt } = await import('crypto')
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  return new Promise((resolve) => {
    scrypt(password, salt, 64, (err, derived) => {
      if (err) {
        resolve(false)
        return
      }
      resolve(derived.toString('hex') === hash)
    })
  })
}

export function generateId(): string {
  return randomBytes(16).toString('hex')
}

export function getUserByEmail(email: string): { id: string; email: string; password_hash: string; nome_completo: string; role: string } | null {
  const database = getDb()
  const row = database.prepare('SELECT id, email, password_hash, nome_completo, role FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string; nome_completo: string; role: string } | undefined
  return row ?? null
}

export function createUser(data: { email: string; password_hash: string; nome_completo: string; role: string }): string {
  const database = getDb()
  const id = generateId()
  database.prepare(
    'INSERT INTO users (id, email, password_hash, nome_completo, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, data.email, data.password_hash, data.nome_completo, data.role)
  return id
}
