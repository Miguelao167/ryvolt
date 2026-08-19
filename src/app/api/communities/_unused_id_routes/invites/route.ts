import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateInviteCode } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .eq('community_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: invites })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can create invites
    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .single()

    const role = member?.role as { permissions?: number[]; name?: string } | null

    const canCreate = role?.permissions?.includes(64) ||
                      role?.name === 'Owner'

    if (!canCreate) {
      return NextResponse.json(
        { error: 'You do not have permission to create invites' },
        { status: 403 }
      )
    }

    const code = generateInviteCode()
    const expiresIn = body.expiresIn || null // null = never expires
    const maxUses = body.maxUses || null // null = unlimited

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        community_id: id,
        code,
        created_by: user.id,
        max_uses: maxUses,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: invite }, { status: 201 })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}
