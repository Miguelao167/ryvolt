# Guia de Configuração do Supabase

Este guia vai ajudá-lo a configurar o Supabase para o **RYVOLT Community Platform**.

## 1. Criar uma conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Cadastre-se com GitHub ou email
4. Crie um novo projeto:
   - **Organization**: Selecione ou crie uma organização
   - **Name**: `ryvolt-platform` (ou outro nome de sua preferência)
   - **Database Password**: Generate a strong password (guarde-o!)
   - **Region**: Selecione a região mais próxima de seus usuários

5. Aguarde ~2 minutos enquanto o projeto é criado

## 2. Obter as credenciais

Após criar o projeto:

1. Acesse **Settings** > **API**
2. Copie os valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Chave que começa com `eyJ...`

3. Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Configurar o banco de dados

### Opção A: SQL Editor (Recomendado)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Opção B: Table Editor

Se preferir configurar manualmente:

1. Vá em **Table Editor**
2. Crie as tabelas na ordem:

#### Tabela: `users`
```sql
-- Esta tabela extiende auth.users do Supabase
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'offline',
  custom_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `communities`
```sql
CREATE TABLE public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  category TEXT NOT NULL,
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `roles`
```sql
CREATE TABLE public.roles (
  id TEXT PRIMARY KEY DEFAULT 'role_' || substr(md5(random()::text), 1, 8),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  permissions INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `community_members`
```sql
CREATE TABLE public.community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id TEXT DEFAULT 'member',
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
```

#### Tabela: `channels`
```sql
CREATE TABLE public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `messages`
```sql
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID,
  pinned BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `reactions`
```sql
CREATE TABLE public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
```

#### Tabela: `invites`
```sql
CREATE TABLE public.invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `friendships`
```sql
CREATE TABLE public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

## 4. Habilitar Row Level Security (RLS)

Após criar as tabelas, vá em cada tabela > **Policies** > **Enable RLS**

Adicione as políticas conforme necessário:

```sql
-- Exemplo para communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communities"
  ON public.communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 5. Configurar Autenticação

1. Vá em **Authentication** > **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`
   - **Enable email confirmations**: Ativar se quiser confirmar email

3. Para provedores OAuth (opcional):
   - **Authentication** > **Providers**
   - Habilite Google, GitHub, etc.

## 6. Configurar Storage (para uploads)

1. Vá em **Storage** > **New bucket**
2. Crie os buckets:
   - `avatars` (público)
   - `community-icons` (público)
   - `attachments` (público)
   - `banners` (público)

3. Para cada bucket, adicione política:
```sql
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING ( bucket_id IN ('avatars', 'community-icons', 'attachments', 'banners') );

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL );
```

## 7. Habilitar Realtime

1. Vá em **Database** > **Replication**
2. Adicione as tabelas para realtime:
   - `messages`
   - `reactions`
   - `community_members`
   - `users`

## 8. Configurar Edge Functions (futuro)

Se precisar de funções serverless:

1. Instale Supabase CLI:
```bash
npm install -g supabase
```

2. Inicialize:
```bash
supabase init
```

3. Deploy:
```bash
supabase functions deploy
```

## 9. Variáveis de ambiente completas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Apenas para server-side

# Opcional - para produção
NEXT_PUBLIC_SITE_URL=https://seusite.com
```

## 10. Testar a configuração

1. Inicie o servidor:
```bash
npm run dev
```

2. Abra http://localhost:3000

3. Tente se registrar/login

4. Verifique no Supabase Dashboard > **Table Editor** se o usuário foi criado

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se a `NEXT_PUBLIC_SUPABASE_ANON_KEY` está correta
- Verifique se não tem espaços ou quebras de linha

### Erro: "Row Level Security error"
- Verifique se RLS está habilitado
- Verifique as políticas de acesso

### Erro: "Connection refused"
- Verifique se o Supabase Project está ativo (não pausado)
- Verifique se o URL está correto

### Erro: "403 Forbidden"
- Problema com políticas RLS
- Tente temporariamente desabilitar RLS para testar

## Próximos passos

1. ✅ Configurar Supabase
2. ✅ Executar migrations
3. Testar autenticação
4. Implementar FASE 3 (Chat em tempo real)

Precisa de ajuda com algum passo específico?
