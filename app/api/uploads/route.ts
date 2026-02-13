import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as any
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const originalName = file.name || 'upload'
    const ext = originalName.split('.').pop() || 'png'
    const filename = `${crypto.randomUUID()}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try { fs.mkdirSync(uploadsDir, { recursive: true }) } catch (e) {}
    const outPath = path.join(uploadsDir, filename)
    fs.writeFileSync(outPath, buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error('Erro upload:', error)
    return NextResponse.json({ error: 'Erro ao enviar arquivo' }, { status: 500 })
  }
}
