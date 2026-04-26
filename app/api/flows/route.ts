import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Flows API — coming in Phase 4' })
}

export async function POST() {
  return NextResponse.json({ message: 'Flows API — coming in Phase 4' }, { status: 201 })
}
