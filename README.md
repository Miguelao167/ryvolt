# RYVOLT

Plataforma de comunidades em tempo real — chat, voz, vídeo e compartilhamento de tela, estilo Discord.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** com paleta Discord customizada
- **Supabase** (auth, postgres, realtime)
- **Framer Motion** (animações)
- **Zustand** (estado)
- **WebRTC** (voz/vídeo peer-to-peer)

## Funcionalidades

- Autenticação completa (login, registro, sessão persistida)
- Comunidades (servidores) com canais de texto, voz e vídeo
- Mensagens em tempo real
- Reações, replies, edição e exclusão de mensagens
- Status online/offline
- Mensagens diretas (DMs)
- Lista de amigos
- Upload de avatar
- WebRTC para chamadas de voz/vídeo
- Design system com tema dark estilo Discord

## Setup local

```bash
# 1. Instala dependências
npm install

# 2. Configura variáveis de ambiente
# Copia .env.example pra .env.local e preenche com tuas chaves Supabase
cp .env.example .env.local

# 3. Roda em dev
npm run dev

# Build de produção
npm run build
npm start
```

Abre em [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (server-only) |
| `NEXT_PUBLIC_SITE_URL` | URL do site (ex: https://ryvolt.vercel.app) |
| `RYVOLT_SECRET_KEY` | Chave secreta do app (≥32 chars) |

## Deploy

A forma mais fácil é usar [Vercel](https://vercel.com):

1. Sobe o código pro GitHub
2. Importa o repositório em vercel.com/new
3. Adiciona as variáveis de ambiente
4. Deploy

Mais detalhes em [docs/](./docs).
