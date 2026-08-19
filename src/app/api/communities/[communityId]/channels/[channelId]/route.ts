import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ communityId: string; channelId: string }> }
) {
  try {
    const { communityId, channelId } = await params
    const supabase = await createClient()
    const body = await request.json()

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

    const canUpdate = role?.permissions?.includes(PERMISSION_BITS.MANAGE_CHANNELS) ||
                      role?.name === 'Owner'

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update channels' },
        { status: 403 }
      )
    }

    const { data: channel, error } = await supabase
      .from('channels')
      .update({
        name: body.name,
        category: body.category,
        position: body.position,
      })
      .eq('id', channelId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: channel })
  } catch (error) {
    console.error('Error updating channel:', error)
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string; channelId: string }> }
) {
  try {
    const { communityId, channelId } = await params
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

    const canDelete = role?.permissions?.includes(PERMISSION_BITS.DELETE_CHANNELS) ||
                      role?.name === 'Owner'

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete channels' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)
      .eq('community_id', communityId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    )
  }
}
