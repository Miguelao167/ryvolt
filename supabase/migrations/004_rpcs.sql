-- =============================================
-- RYVOLT - Helper RPCs (idempotent)
-- =============================================

-- Atomic increment of invite uses (avoids read-modify-write races)
CREATE OR REPLACE FUNCTION public.increment_invite_uses(p_invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invites SET uses = uses + 1 WHERE id = p_invite_id;
END;
$$;
