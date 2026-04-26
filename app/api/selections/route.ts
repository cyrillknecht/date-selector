import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'Selections API — coming in Phase 8' }, { status: 201 })
}
