-- =============================================
-- Fix DM RLS: permitir criar threads + adicionar participantes
-- =============================================
-- O schema inicial (001) só criou policies de SELECT nas tabelas
-- dm_threads / dm_participants. Sem INSERT policy, qualquer tentativa
-- de criar uma DM falha com "new row violates row-level security policy".

-- dm_threads: qualquer usuário autenticado pode criar uma thread vazia
-- (a checagem de "pode falar com essa pessoa" acontece ao adicionar
-- participantes, na próxima policy).
DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.dm_threads;

CREATE POLICY "Authenticated users can create threads" ON public.dm_threads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- O criador pode deletar a thread (opcional, mas útil)
DROP POLICY IF EXISTS "Participants can delete their threads" ON public.dm_threads;

CREATE POLICY "Participants can delete their threads" ON public.dm_threads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.dm_participants
      WHERE thread_id = dm_threads.id
        AND user_id = auth.uid()
    )
  );

-- dm_participants: pode adicionar a si mesmo OU adicionar alguém numa
-- thread que o próprio caller também é participante.
DROP POLICY IF EXISTS "Users can add participants" ON public.dm_participants;

CREATE POLICY "Users can add participants" ON public.dm_participants
  FOR INSERT WITH CHECK (
    -- 1) O caller é o próprio user sendo adicionado (DM self-add)
    user_id = auth.uid()
    OR
    -- 2) O caller já é participante da thread que está sendo populada
    EXISTS (
      SELECT 1 FROM public.dm_participants dp
      WHERE dp.thread_id = dm_participants.thread_id
        AND dp.user_id = auth.uid()
    )
  );

-- dm_participants: usuário pode sair da thread (DELETE da própria linha)
DROP POLICY IF EXISTS "Users can remove themselves" ON public.dm_participants;

CREATE POLICY "Users can remove themselves" ON public.dm_participants
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.dm_participants dp
      WHERE dp.thread_id = dm_participants.thread_id
        AND dp.user_id = auth.uid()
    )
  );