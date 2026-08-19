import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


const communitySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['gaming', 'technology', 'friends', 'study', 'company', 'creators', 'community', 'other']),
})

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_members(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: communities })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate input
    const validated = communitySchema.parse(body)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create community
    const { data: community, error } = await supabase
      .from('communities')
      .insert({
        name: validated.name,
        description: validated.description,
        category: validated.category,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as owner with all permissions
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        user_id: user.id,
        role_id: 'owner', // This will be created by trigger
      })

    if (memberError) throw memberError

    // Create default channels
    const defaultChannels = [
      { name: 'general', type: 'text', category: 'Information' },
      { name: 'announcements', type: 'text', category: 'Information' },
      { name: 'general', type: 'voice', category: 'Voice' },
    ]

    for (let i = 0; i < defaultChannels.length; i++) {
      await supabase.from('channels').insert({
        community_id: community.id,
        name: defaultChannels[i].name,
        type: defaultChannels[i].type,
        category: defaultChannels[i].category,
        position: i,
      })
    }

    return NextResponse.json({ data: community }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating community:', error)
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    )
  }
}
