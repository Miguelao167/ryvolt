-- =============================================
-- RYVOLT Community Platform Database Schema
-- =============================================
-- Run this in your Supabase SQL Editor.
-- Se a migration falhou parcialmente antes, rode primeiro
-- o arquivo 000_reset.sql e depois este.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  custom_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- COMMUNITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('gaming', 'technology', 'friends', 'study', 'company', 'creators', 'community', 'other')),
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can update communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can delete communities" ON public.communities;

CREATE POLICY "Anyone can view communities" ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update communities" ON public.communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = communities.id
        AND cm.user_id = auth.uid()
        AND r.name = 'Owner'
    )
  );

CREATE POLICY "Owners can delete communities" ON public.communities
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- =============================================
-- ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY DEFAULT 'role_' || substr(md5(random()::text), 1, 8),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  permissions INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;

CREATE POLICY "Members can view roles" ON public.roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = roles.community_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = roles.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 128) = 128)
    )
  );

-- =============================================
-- COMMUNITY MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role_id TEXT REFERENCES public.roles(id) DEFAULT 'member',
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view other members" ON public.community_members;
DROP POLICY IF EXISTS "Members can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;

CREATE POLICY "Members can view other members" ON public.community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON public.community_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 16) = 16)
    )
  );

-- =============================================
-- CHANNELS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice', 'video')),
  category TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can manage channels" ON public.channels;

CREATE POLICY "Members can view channels" ON public.channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = channels.community_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage channels" ON public.channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = channels.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 2) = 2)
    )
  );

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  pinned BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Members can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Members can delete messages" ON public.messages;

CREATE POLICY "Members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.channels c ON c.community_id = cm.community_id
      WHERE c.id = messages.channel_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.channels c ON c.community_id = cm.community_id
      WHERE c.id = messages.channel_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own messages" ON public.messages
  FOR UPDATE USING (
    (auth.uid() = author_id) OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      JOIN public.channels c ON c.community_id = cm.community_id
      WHERE c.id = messages.channel_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 8) = 8)
    )
  );

CREATE POLICY "Members can delete messages" ON public.messages
  FOR DELETE USING (
    (auth.uid() = author_id) OR
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      JOIN public.channels c ON c.community_id = cm.community_id
      WHERE c.id = messages.channel_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 8) = 8)
    )
  );

-- =============================================
-- REACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can remove reactions" ON public.reactions;

CREATE POLICY "Anyone can view reactions" ON public.reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INVITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view invites" ON public.invites;
DROP POLICY IF EXISTS "Members can create invites" ON public.invites;

CREATE POLICY "Members can view invites" ON public.invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = invites.community_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create invites" ON public.invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = invites.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 64) = 64)
    )
  );

-- =============================================
-- FRIENDSHIPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships" ON public.friendships;

CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =============================================
-- DM THREADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dm_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own threads" ON public.dm_threads;

CREATE POLICY "Users can view own threads" ON public.dm_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_participants
      WHERE thread_id = dm_threads.id
        AND user_id = auth.uid()
    )
  );

-- =============================================
-- DM PARTICIPANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dm_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.dm_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants" ON public.dm_participants;

CREATE POLICY "Users can view participants" ON public.dm_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_participants dp
      WHERE dp.thread_id = dm_participants.thread_id
        AND dp.user_id = auth.uid()
    )
  );

-- =============================================
-- DM MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.dm_threads(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.dm_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.dm_messages;

CREATE POLICY "Participants can view messages" ON public.dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_participants
      WHERE thread_id = dm_messages.thread_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON public.dm_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.dm_participants
      WHERE thread_id = dm_messages.thread_id
        AND user_id = auth.uid()
    )
  );

-- =============================================
-- BANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.bans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view bans" ON public.bans;
DROP POLICY IF EXISTS "Admins can manage bans" ON public.bans;

CREATE POLICY "Admins can view bans" ON public.bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = bans.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 32) = 32)
    )
  );

CREATE POLICY "Admins can manage bans" ON public.bans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = bans.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 32) = 32)
    )
  );

-- =============================================
-- TIMEOUTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.timeouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_member_id UUID REFERENCES public.community_members(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage timeouts" ON public.timeouts;

CREATE POLICY "Admins can manage timeouts" ON public.timeouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      JOIN public.roles r ON cm.role_id = r.id
      WHERE cm.community_id = timeouts.community_id
        AND cm.user_id = auth.uid()
        AND (r.name = 'Owner' OR (r.permissions & 16) = 16)
    )
  );

-- =============================================
-- FUNCTION: Create default roles for community
-- =============================================
CREATE OR REPLACE FUNCTION public.create_default_roles(community_uuid UUID)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.roles WHERE community_id = community_uuid) THEN
    RETURN;
  END IF;

  INSERT INTO public.roles (community_id, name, color, permissions, position, is_owner)
  VALUES (community_uuid, 'Owner', '#EF4444', 8191, 0, TRUE);

  INSERT INTO public.roles (community_id, name, color, permissions, position)
  VALUES (community_uuid, 'Admin', '#F97316', 4094, 1);

  INSERT INTO public.roles (community_id, name, color, permissions, position)
  VALUES (community_uuid, 'Moderator', '#10B981', 3128, 2);

  INSERT INTO public.roles (community_id, name, color, permissions, position)
  VALUES (community_uuid, 'Member', '#6B7280', 528, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Handle new user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Update community member counts
-- =============================================
CREATE OR REPLACE FUNCTION public.update_community_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_member_count ON public.community_members;
CREATE TRIGGER update_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_counts();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);
CREATE INDEX IF NOT EXISTS idx_channels_community ON public.channels(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON public.messages(author_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(code);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON public.dm_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON public.dm_messages(thread_id);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'dm_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
  END IF;
END $$;

-- =============================================
-- DONE
-- =============================================
SELECT 'RYVOLT schema installed successfully' AS status;