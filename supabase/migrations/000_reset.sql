-- =============================================
-- RYVOLT Community Platform - Schema Reset (v3)
-- =============================================
-- v2 -> v3: triggers são dropados pelo NOME via pg_trigger,
-- não pela referência à tabela, para não quebrar se já
-- tiverem sido dropadas em uma tentativa anterior.

-- Dropa triggers PRIMEIRO via catálogo (não referencia tabelas)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tgname, tgrelid::regclass AS tbl
           FROM pg_trigger
           WHERE tgname IN ('update_member_count', 'on_auth_user_created')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', r.tgname, r.tbl);
  END LOOP;
END $$;

-- Dropa tabelas (ordem inversa das dependências)
DROP TABLE IF EXISTS public.timeouts CASCADE;
DROP TABLE IF EXISTS public.bans CASCADE;
DROP TABLE IF EXISTS public.dm_messages CASCADE;
DROP TABLE IF EXISTS public.dm_participants CASCADE;
DROP TABLE IF EXISTS public.dm_threads CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Dropa funções
DROP FUNCTION IF EXISTS public.create_default_roles(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_community_counts() CASCADE;

-- Remove das publicações de realtime (via INFORMATION_SCHEMA; não quebra
-- se a tabela não existir e tolera tabelas fora do schema public)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_publication_tables pt
    JOIN pg_class c ON c.oid = pt.tablename::regclass
    WHERE pt.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', r.tbl);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;