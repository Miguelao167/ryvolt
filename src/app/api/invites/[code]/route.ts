import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    // Find invite with community info
    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        *,
        community:communities(
          id,
          name,
          description,
          icon_url,
          banner_url,
          category,
          member_count,
          online_count
        )
      `)
      .eq('code', code)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    // Check if max uses reached
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return NextResponse.json(
        { error: 'This invite has reached its maximum uses' },
        { status: 410 }
      )
    }

    return NextResponse.json({ data: invite })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json(
      { error: 'Failed to validate invite' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find invite
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    // Check if max uses reached
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return NextResponse.json(
        { error: 'This invite has reached its maximum uses' },
        { status: 410 }
      )
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', invite.community_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      )
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: invite.community_id,
        user_id: user.id,
        role_id: 'member', // Default role
      })

    if (memberError) throw memberError

    // Increment invite uses
    await supabase
      .from('invites')
      .update({ uses: invite.uses + 1 })
      .eq('id', invite.id)

    // Update community member count
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', invite.community_id)
      .single()

    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: (community.member_count || 0) + 1 })
        .eq('id', invite.community_id)
    }

    return NextResponse.json({
      success: true,
      communityId: invite.community_id,
    })
  } catch (error) {
    console.error('Error joining community:', error)
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    )
  }
}
