import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string; memberId: string }> }
) {
  try {
    const { communityId, memberId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { duration, reason } = body

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has permission
    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const role = member?.role as { permissions?: number[]; name?: string } | null

    if (!role?.permissions?.includes(PERMISSION_BITS.KICK_MEMBERS) &&
        role?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'You do not have permission to timeout members' },
        { status: 403 }
      )
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('community_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't timeout owner
    if (targetMember.role?.name === 'Owner') {
      return NextResponse.json(
        { error: 'Cannot timeout the owner' },
        { status: 400 }
      )
    }

    const expiresAt = new Date(Date.now() + (duration || 300) * 1000).toISOString()

    const { data: timeout, error } = await supabase
      .from('timeouts')
      .insert({
        community_member_id: memberId,
        community_id: communityId,
        reason,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: timeout }, { status: 201 })
  } catch (error) {
    console.error('Error creating timeout:', error)
    return NextResponse.json(
      { error: 'Failed to timeout member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string; memberId: string }> }
) {
  try {
    const { communityId, memberId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has permission
    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const role = member?.role as { permissions?: number[]; name?: string } | null

    if (!role?.permissions?.includes(PERMISSION_BITS.KICK_MEMBERS) &&
        role?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'You do not have permission to manage timeouts' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('timeouts')
      .delete()
      .eq('community_member_id', memberId)
      .gt('expires_at', new Date().toISOString())

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing timeout:', error)
    return NextResponse.json(
      { error: 'Failed to remove timeout' },
      { status: 500 }
    )
  }
}
