-- =============================================
-- RYVOLT - Webhooks + custom emojis
-- =============================================
-- These tables back the Integrações and Emoji settings panels.
-- They are public-readable by community members; writes are restricted
-- to community owners/mods.

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhooks_read" ON public.webhooks;
CREATE POLICY "webhooks_read" ON public.webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = webhooks.community_id
        AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "webhooks_write" ON public.webhooks;
CREATE POLICY "webhooks_write" ON public.webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = webhooks.community_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = webhooks.community_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS webhooks_community_idx ON public.webhooks(community_id);

CREATE TABLE IF NOT EXISTS public.emojis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, name)
);

ALTER TABLE public.emojis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emojis_read" ON public.emojis;
CREATE POLICY "emojis_read" ON public.emojis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = emojis.community_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = emojis.community_id
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "emojis_write" ON public.emojis;
CREATE POLICY "emojis_write" ON public.emojis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = emojis.community_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = emojis.community_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS emojis_community_idx ON public.emojis(community_id);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhooks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emojis;
