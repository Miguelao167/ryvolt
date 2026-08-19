# Testando WebRTC localmente

A Fase 5 do RYVOLT foi construída com uma camada de **signaling
abstraída** — funciona em modo **loopback (memória)** sem precisar
de backend, e troca para **Supabase Realtime** quando estiver
configurado (uma linha de mudança).

Este guia mostra como testar voz e vídeo entre dois usuários
locais antes mesmo de mexer no Supabase.

## Setup

1. Rode o app:
   ```bash
   npm run dev
   ```
2. Abra **duas abas do navegador** na home (ex: `http://localhost:3000/app`).
3. Em cada aba, faça login com contas diferentes (ou use o mock user — o
   `userId` é derivado de `authStore.user.id`).

> Importante: cada aba é uma "instância" separada do
> `LoopbackSignaling`. O `static bus` em memória conecta todas as
> instâncias abertas na mesma origem. Para testar entre **dois
> devices reais na mesma rede** você vai precisar rodar com HTTPS
> (WebRTC exige secure context exceto em `localhost`).

## Teste de voz (1:1)

1. Aba A: clique no canal "Voice Chat" na sidebar.
2. Autorize o uso do microfone quando o browser pedir.
3. Aba B: clique também em "Voice Chat".
4. As duas abas devem aparecer como participantes uma da outra.
5. Fale no mic da aba A → o avatar na aba B deve mostrar o anel verde
   pulsando quando você fala (indicador de speaking).
6. Clique em **Mute** na aba A → o badge vermelho `MicOff` deve
   aparecer no tile da aba B.

## Teste de vídeo

1. Crie um canal do tipo `video` (ou use "Movie Night" do mock).
2. Clique nele — vai pedir permissão de câmera.
3. Abra em outra aba — o vídeo da primeira aba deve aparecer na
   segunda.
4. Teste Picture-in-Picture clicando no ícone de PiP no overlay.
5. Teste Fullscreen no ícone de maximizar.

## Teste de reconexão

1. Abra DevTools > Network na aba A.
2. Force um disconnect (DevTools > Network > Throttling: Offline).
3. O tile da aba B deve mostrar "Reconnecting" e tentar ICE restart.
4. Volte a network para online — deve reconectar sozinho.

## Cenários de erro esperados

| Cenário | Comportamento |
|---|---|
| Microfone bloqueado | UI mostra estado mutado permanente + aviso no console |
| Conexão peer cai | `onconnectionstatechange` → `'failed'` → ICE restart |
| User sai do canal | Sinal `leave` enviado, peer fechado nos outros |
| Áudio chega com eco | Echo cancellation ativado nas constraints |
| Mesma aba aberta 2x | Funciona (cada aba = adapter separado) |

## Migrando para Supabase (quando o banco estiver pronto)

Abra `src/components/providers/SignalingProvider.tsx` e troque:

```ts
import { LoopbackSignaling } from '@/lib/webrtc'
const adapter = new LoopbackSignaling()
```

Por:

```ts
import { SupabaseSignaling } from '@/lib/webrtc'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const adapter = new SupabaseSignaling(supabase)
```

Pronto — o resto do código (`Room`, `PeerConnection`, `MediaManager`,
todos os componentes UI) **não muda nada**. A interface
`SignalingAdapter` é o único ponto de troca.

## Próximos passos (Fase 5 → Fase 6 → 7)

- **Fase 6 (Screen sharing):** adicionar `getDisplayMedia()` e um
  track de `video` separado; sinalizar via tipo `screen-share`.
- **Fase 7 (SFU):** quando passar de ~5 participantes por canal,
  trocar mesh por SFU (mediasoup/janus). A interface `SignalingAdapter`
  continua a mesma — só adiciona um `TransportAdapter` paralelo.