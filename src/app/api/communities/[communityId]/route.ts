import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()

    const { data: community, error } = await supabase
      .from('communities')
      .select(`
        *,
        channels(*),
        community_members(
          *,
          user:users(*),
          role:roles(*)
        ),
        invites(*)
      `)
      .eq('id', communityId)
      .single()

    if (error) throw error

    return NextResponse.json({ data: community })
  } catch (error) {
    console.error('Error fetching community:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community' },
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const memberRole = member?.role as { name?: string } | null

    if (!memberRole || memberRole.name !== 'Owner') {
      return NextResponse.json(
        { error: 'Only owners can update community' },
        { status: 403 }
      )
    }

    const { data: community, error } = await supabase
      .from('communities')
      .update({
        name: body.name,
        description: body.description,
        icon_url: body.iconUrl,
        banner_url: body.bannerUrl,
        category: body.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', communityId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: community })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: community } = await supabase
      .from('communities')
      .select('created_by')
      .eq('id', communityId)
      .single()

    if (community?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only owners can delete community' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    )
  }
}
