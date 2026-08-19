-- =============================================
-- 008 — Garantir grants de INSERT/UPDATE/DELETE em dm_messages
-- =============================================
-- Mesmo com RLS desabilitado nas outras tabelas DM, é comum
-- esquecer de aplicar os grants no dm_messages. Esta migração
-- garante que o role `authenticated` pode inserir mensagens.
--
-- Sintomas se faltar:
--   - Chat abre, lista mensagens, mas enviar não funciona
--   - Console: "permission denied for table dm_messages"

GRANT ALL ON public.dm_messages TO authenticated;
GRANT ALL ON public.dm_messages TO anon;
GRANT ALL ON public.dm_messages TO service_role;

-- Garante também nas tabelas relacionadas (idempotente)
GRANT ALL ON public.dm_threads TO authenticated;
GRANT ALL ON public.dm_participants TO authenticated;
