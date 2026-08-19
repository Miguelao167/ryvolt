-- =============================================
-- RYVOLT - Storage buckets + policies
-- =============================================
-- Bucket: avatars
--   - 1 file per user (avatars/<user-id>.<ext>)
--   - Public read, owner write/update/delete
--
-- Bucket: community-assets
--   - icons/banners per community
--   - Public read, only community owner can write
--   - Path: community-assets/<community-id>/icon.<ext>

-- ===== BUCKETS =====
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('community-assets', 'community-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ===== AVATARS POLICIES =====
-- Public read (bucket is public, but keep explicit)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload/update/delete only their own avatar (path starts with their uid)
DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- ===== COMMUNITY-ASSETS POLICIES =====
-- Public read
DROP POLICY IF EXISTS "community_assets_public_read" ON storage.objects;
CREATE POLICY "community_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-assets');

-- Only community owners can write
DROP POLICY IF EXISTS "community_assets_owner_write" ON storage.objects;
CREATE POLICY "community_assets_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-assets'
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE id::text = split_part(name, '/', 1)
        AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_assets_owner_update" ON storage.objects;
CREATE POLICY "community_assets_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'community-assets'
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE id::text = split_part(name, '/', 1)
        AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_assets_owner_delete" ON storage.objects;
CREATE POLICY "community_assets_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'community-assets'
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE id::text = split_part(name, '/', 1)
        AND owner_id = auth.uid()
    )
  );
