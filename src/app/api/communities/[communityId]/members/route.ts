import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()

    const { data: members, error } = await supabase
      .from('community_members')
      .select(`
        *,
        user:users(
          id,
          email,
          username,
          display_name,
          avatar_url,
          status
        ),
        role:roles(*)
      `)
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { targetUserId, roleId, nickname } = body

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has permission to manage members
    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const memberRole = member?.role as { permissions?: number[]; name?: string; position?: number } | null

    // Check if user is owner
    if (memberRole?.name !== 'Owner') {
      // Check specific permissions
      if (roleId && !memberRole?.permissions?.includes(PERMISSION_BITS.MANAGE_ROLES)) {
        return NextResponse.json(
          { error: 'You do not have permission to change roles' },
          { status: 403 }
        )
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (roleId) updates.role_id = roleId
    if (nickname !== undefined) updates.nickname = nickname

    const { data: updatedMember, error } = await supabase
      .from('community_members')
      .update(updates)
      .eq('community_id', communityId)
      .eq('user_id', targetUserId)
      .select(`
        *,
        user:users(*),
        role:roles(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ data: updatedMember })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
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
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's role
    const { data: currentMember } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const currentRole = currentMember?.role as { permissions?: number[]; name?: string; position?: number } | null

    // Get target user's role
    const { data: targetMember } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', targetUserId)
      .single()

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const targetRole = targetMember.role as { name?: string; position?: number } | null;

    // Users can always remove themselves
    if (targetUserId === user.id) {
      // Check if user is owner
      if (targetRole?.name === 'Owner') {
        return NextResponse.json(
          { error: 'Owners cannot leave. Transfer ownership first.' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', targetUserId)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    // Only owners/admins with kick permission can remove others
    const canKick = currentRole?.name === 'Owner' ||
                   (currentRole?.permissions?.includes(PERMISSION_BITS.KICK_MEMBERS) &&
                    (targetRole?.position ?? 0) > (currentRole?.position ?? 0))

    if (!canKick) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', targetUserId)

    if (error) throw error

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
