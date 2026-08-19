import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

const roleSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  permissions: z.array(z.number()),
  position: z.number().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const supabase = await createClient()

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .eq('community_id', communityId)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
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

    const userRole = member?.role as { permissions?: number[]; name?: string } | null

    if (!userRole?.permissions?.includes(PERMISSION_BITS.MANAGE_ROLES) &&
        userRole?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'You do not have permission to manage roles' },
        { status: 403 }
      )
    }

    const validated = roleSchema.parse(body)

    // Calculate permissions bitmask
    const permissionsBitmask = validated.permissions.reduce((acc, perm) => acc | perm, 0)

    // Get next position
    const { data: lastRole } = await supabase
      .from('roles')
      .select('position')
      .eq('community_id', communityId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = validated.position ?? (lastRole ? lastRole.position + 1 : 0)

    const { data: newRole, error } = await supabase
      .from('roles')
      .insert({
        community_id: communityId,
        name: validated.name,
        color: validated.color,
        permissions: permissionsBitmask,
        position,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: newRole }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
