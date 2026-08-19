-- =============================================
-- RYVOLT - Storage policy fix
-- =============================================
-- The previous migration (003) assumed avatars go under users/<uid>.png and
-- community assets under community-assets/<communityId>/icon.<ext>, but the
-- client was uploading everything to bucket `avatars` using paths like
-- `users/<uid>/<uuid>.png` and `communities/<cid>/icon/<uuid>.png`.
--
-- This migration:
--   1. Adjusts the avatars policy to accept the `users/<uid>/` prefix
--   2. Adds INSERT/UPDATE/DELETE policies on `avatars` bucket for community
--      members (community path: `communities/<communityId>/...`)
--   3. Keeps community-assets policies as-is for the dedicated bucket

-- ===== AVATARS POLICIES (recreate with new path patterns) =====

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (
      -- user avatar path: users/<auth.uid>/...
      split_part(name, '/', 1) = 'users'
        AND split_part(name, '/', 2) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (
      split_part(name, '/', 1) = 'users'
        AND split_part(name, '/', 2) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (
      split_part(name, '/', 1) = 'users'
        AND split_part(name, '/', 2) = auth.uid()::text
    )
  );

-- Community members can upload community assets to the avatars bucket
DROP POLICY IF EXISTS "community_avatars_member_write" ON storage.objects;
CREATE POLICY "community_avatars_member_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = 'communities'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id::text = split_part(name, '/', 2)
        AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_avatars_member_update" ON storage.objects;
CREATE POLICY "community_avatars_member_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = 'communities'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id::text = split_part(name, '/', 2)
        AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_avatars_member_delete" ON storage.objects;
CREATE POLICY "community_avatars_member_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = 'communities'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id::text = split_part(name, '/', 2)
        AND cm.user_id = auth.uid()
    )
  );

-- Also ensure the community-assets bucket exists (in case 003 didn't run)
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-assets', 'community-assets', true)
ON CONFLICT (id) DO NOTHING;
