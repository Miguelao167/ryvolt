// =============================================
// RYVOLT - WebRTC shared types
// =============================================
// Tipos compartilhados entre o peer manager, signaling e UI.

export type MediaKind = 'audio' | 'video'

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed'
  | 'closed'

export interface Participant {
  /** Stable user id (Supabase auth user id when available) */
  userId: string
  /** Display name shown in tile */
  displayName: string
  /** Avatar URL (optional) */
  avatarUrl?: string | null
  /** Connection state for this specific peer */
  state: ConnectionState
  /** Is the participant muted? (we know because of signaling, not media) */
  muted: boolean
  /** Is the participant deafened? */
  deafened: boolean
  /** Is the participant's screen being shared? */
  isStreaming: boolean
  /** Local screen stream for self (set by media manager when streaming) */
  screenStream?: MediaStream | null
  /** Is the participant's camera video on? */
  videoOff: boolean
  /** Is the participant currently speaking (audio level above threshold) */
  speaking: boolean
  /** Audio level 0..1 (last measured) */
  audioLevel: number
  /** Local stream for self - set by media manager */
  stream?: MediaStream | null
  /** Joined at */
  joinedAt: number
}

export interface VoiceRoom {
  /** Channel id this room represents */
  channelId: string
  /** Community id the channel belongs to */
  communityId: string
  /** Participants keyed by user id */
  participants: Map<string, Participant>
  /** Is the local user in the room */
  joined: boolean
  /** Local user id */
  localUserId: string | null
}

export interface SignalMessage {
  type:
    | 'join'
    | 'leave'
    | 'offer'
    | 'answer'
    | 'ice'
    | 'mute-state'
    | 'speaking'
    | 'renegotiate'
  from: string
  to?: string
  payload?: unknown
}

export interface SignalEnvelope {
  /** Routing - usually the channelId */
  room: string
  msg: SignalMessage
}

export interface MediaDeviceInfo {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

export type MediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput'