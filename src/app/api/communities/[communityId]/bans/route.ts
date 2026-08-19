import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string; memberId: string }> }
) {
  try {
    const { communityId, memberId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { reason } = body

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

    if (!role?.permissions?.includes(PERMISSION_BITS.BAN_MEMBERS) &&
        role?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'You do not have permission to ban members' },
        { status: 403 }
      )
    }

    // Get target member info
    const { data: targetMember } = await supabase
      .from('community_members')
      .select('*, user:users(*)')
      .eq('id', memberId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't ban owner
    if (targetMember.role?.name === 'Owner') {
      return NextResponse.json(
        { error: 'Cannot ban the owner' },
        { status: 400 }
      )
    }

    // Create ban record
    const { data: ban, error } = await supabase
      .from('bans')
      .insert({
        community_id: communityId,
        user_id: targetMember.user_id,
        reason,
        banned_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Remove from community
    await supabase
      .from('community_members')
      .delete()
      .eq('id', memberId)

    // Update member count
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single()

    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: Math.max(0, (community.member_count || 0) - 1) })
        .eq('id', communityId)
    }

    return NextResponse.json({ data: ban }, { status: 201 })
  } catch (error) {
    console.error('Error banning member:', error)
    return NextResponse.json(
      { error: 'Failed to ban member' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()

    const { data: bans, error } = await supabase
      .from('bans')
      .select(`
        *,
        user:users(
          id,
          username,
          display_name,
          avatar_url
        ),
        banned_by_user:users!banned_by(
          username,
          display_name
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: bans })
  } catch (error) {
    console.error('Error fetching bans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bans' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

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

    if (!role?.permissions?.includes(PERMISSION_BITS.BAN_MEMBERS) &&
        role?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'You do not have permission to unban members' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('bans')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unbanning member:', error)
    return NextResponse.json(
      { error: 'Failed to unban member' },
      { status: 500 }
    )
  }
}
