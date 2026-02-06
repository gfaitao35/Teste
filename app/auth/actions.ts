'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  createSessionCookie,
  getSessionCookieName,
  getSessionCookieOptions,
  hashPassword,
  verifyPassword,
  getUserByEmail,
  createUser,
  generateId,
} from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha email e senha.' }
  }

  const user = getUserByEmail(email)
  if (!user) {
    return { error: 'Email ou senha incorretos. Tente novamente.' }
  }

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) {
    return { error: 'Email ou senha incorretos. Tente novamente.' }
  }

  const cookieValue = createSessionCookie({
    userId: user.id,
    email: user.email,
    nome_completo: user.nome_completo,
    role: user.role,
  })

  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieName(), cookieValue, getSessionCookieOptions())

  redirect('/dashboard')
}

export async function signUpAction(formData: FormData) {
  const nomeCompleto = ((formData.get('nome_completo') ?? formData.get('nomeCompleto')) as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = (formData.get('confirm_password') ?? formData.get('confirmPassword')) as string
  const role = ((formData.get('role') as string) || 'operador') as 'admin' | 'operador'

  if (!nomeCompleto || !email || !password) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  if (getUserByEmail(email)) {
    return { error: 'Este email já está cadastrado.' }
  }

  const password_hash = await hashPassword(password)
  createUser({ email, password_hash, nome_completo: nomeCompleto, role })

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(getSessionCookieName())
  redirect('/auth/login')
}
