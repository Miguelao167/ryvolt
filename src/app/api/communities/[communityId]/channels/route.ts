import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

const channelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'voice', 'video']),
  category: z.string().optional(),
})

export type ChannelSchema = z.infer<typeof channelSchema>

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()

    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('community_id', communityId)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
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

    const canCreate = role?.permissions?.includes(PERMISSION_BITS.MANAGE_CHANNELS) ||
                      role?.name === 'Owner'

    if (!canCreate) {
      return NextResponse.json(
        { error: 'You do not have permission to create channels' },
        { status: 403 }
      )
    }

    // Get next position
    const { data: lastChannel } = await supabase
      .from('channels')
      .select('position')
      .eq('community_id', communityId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = lastChannel ? lastChannel.position + 1 : 0

    const validated = channelSchema.parse(body)

    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        community_id: communityId,
        name: validated.name,
        type: validated.type,
        category: validated.category || null,
        position,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: channel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
