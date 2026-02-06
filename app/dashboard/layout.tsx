import React from 'react'
import { redirect } from 'next/navigation'
import { getSessionUserId } from '@/lib/session'
import { getDb } from '@/lib/db'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getSessionUserId()
  if (!userId) {
    redirect('/auth/login')
  }

  const database = getDb()
  const row = database.prepare('SELECT id, nome_completo, role, created_at, updated_at FROM users WHERE id = ?').get(userId) as { id: string; nome_completo: string; role: string; created_at: string; updated_at: string } | undefined
  const profile: Profile | null = row
    ? {
        id: row.id,
        nome_completo: row.nome_completo,
        role: row.role as Profile['role'],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    : null

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
