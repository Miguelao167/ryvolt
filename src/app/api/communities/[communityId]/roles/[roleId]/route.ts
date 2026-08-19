import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PERMISSION_BITS } from '@/lib/permissions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ communityId: string; roleId: string }> }
) {
  try {
    const { communityId, roleId } = await params
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

    // Check if trying to modify owner role
    const { data: targetRole } = await supabase
      .from('roles')
      .select('is_owner, name')
      .eq('id', roleId)
      .single()

    const castedRole = targetRole as { is_owner?: boolean; name?: string } | null;

    if (castedRole?.is_owner && castedRole?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'Only owners can modify owner role' },
        { status: 403 }
      )
    }

    // Calculate permissions bitmask if permissions provided
    const permissionsBitmask = body.permissions
      ? body.permissions.reduce((acc: number, perm: number) => acc | perm, 0)
      : undefined

    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update({
        name: body.name,
        color: body.color,
        permissions: permissionsBitmask,
        position: body.position,
      })
      .eq('id', roleId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: updatedRole })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string; roleId: string }> }
) {
  try {
    const { communityId, roleId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is owner
    const { data: member } = await supabase
      .from('community_members')
      .select('role:roles(*)')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single()

    const userRole = member?.role as { permissions?: number[]; name?: string } | null

    if (userRole?.name !== 'Owner') {
      return NextResponse.json(
        { error: 'Only owners can delete roles' },
        { status: 403 }
      )
    }

    // Check if role is owner role
    const { data: targetRole } = await supabase
      .from('roles')
      .select('is_owner')
      .eq('id', roleId)
      .single()

    if (targetRole?.is_owner) {
      return NextResponse.json(
        { error: 'Cannot delete owner role' },
        { status: 400 }
      )
    }

    // Check if any members have this role
    const { data: membersWithRole } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('role_id', roleId)
      .limit(1)

    if (membersWithRole && membersWithRole.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to members' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('community_id', communityId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
