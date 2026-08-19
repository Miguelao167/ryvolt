'use client'

import { create } from 'zustand'
import type { Participant, ConnectionState } from '@/lib/webrtc'
import { VoiceRoom as VoiceRoomClass } from '@/lib/webrtc/room'

type VoiceRoom = VoiceRoomClass

interface VoiceState {
  /** Channel id of the active voice room */
  activeChannelId: string | null
  /** Whether video is enabled in the active room */
  videoEnabled: boolean
  /** Participants in the current room (excluding self as separate entry) */
  participants: Map<string, Participant>
  /** Connection state */
  connectionState: ConnectionState
  /** Internal room instance (not reactive) */
  _room: InstanceType<typeof VoiceRoomClass> | null
  /** Whether the local user is currently sharing screen */
  isStreaming: boolean
  /** Current quality preference for screen share */
  screenQuality: 'sd' | 'hd'
  /** Current FPS preference */
  screenFps: number
  /** Whether to capture audio along with screen */
  screenAudio: boolean

  join: (params: {
    channelId: string
    communityId: string
    selfId: string
    selfDisplayName: string
    selfAvatar?: string | null
    withVideo?: boolean
  }) => Promise<void>
  leave: () => void
  setMuted: (muted: boolean) => void
  setDeafened: (deafened: boolean) => void
  setVideoOff: (off: boolean) => void
  setVideoEnabled: (on: boolean) => void
  setIsStreaming: (v: boolean) => void
  setScreenQuality: (q: 'sd' | 'hd') => void
  setScreenFps: (fps: number) => void
  setScreenAudio: (v: boolean) => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeChannelId: null,
  videoEnabled: false,
  participants: new Map(),
  connectionState: 'idle',
  _room: null,
  isStreaming: false,
  screenQuality: 'sd',
  screenFps: 30,
  screenAudio: false,

  join: async ({
    channelId,
    communityId,
    selfId,
    selfDisplayName,
    selfAvatar,
    withVideo = false,
  }) => {
    // Clean up any prior room
    get().leave()

    const room = new VoiceRoomClass({
      channelId,
      communityId,
      selfId,
      selfDisplayName,
      selfAvatar: selfAvatar ?? null,
    })

    room.on((ev: { kind: string; [k: string]: any }) => {
      if (ev.kind === 'participant-joined' || ev.kind === 'participant-updated') {
        set((s) => {
          const next = new Map(s.participants)
          next.set(ev.participant.userId, ev.participant)
          return { participants: next }
        })
      } else if (ev.kind === 'participant-left') {
        set((s) => {
          const next = new Map(s.participants)
          next.delete(ev.userId)
          return { participants: next }
        })
      } else if (ev.kind === 'stream') {
        // stream event handled via participant update
      } else if (ev.kind === 'state') {
        set({ connectionState: ev.state })
      }
    })

    set({
      _room: room,
      activeChannelId: channelId,
      videoEnabled: withVideo,
      participants: new Map(),
      connectionState: 'connecting',
      isStreaming: false,
    })

    await room.join({ audio: true, video: withVideo })

    set((s) => {
      const next = new Map(s.participants)
      const self = room.getParticipants().find((p: Participant) => p.userId === selfId)
      if (self) next.set(selfId, self)
      return { participants: next }
    })
  },

  leave: () => {
    const room = get()._room
    room?.leave()
    set({
      activeChannelId: null,
      videoEnabled: false,
      participants: new Map(),
      connectionState: 'idle',
      _room: null,
      isStreaming: false,
    })
  },

  setMuted: (muted) => {
    const room = get()._room
    room?.setMuted(muted)
  },

  setDeafened: (deafened) => {
    const room = get()._room
    room?.setDeafened(deafened)
  },

  setVideoOff: (off) => {
    const room = get()._room
    room?.setVideoOff(off)
  },

  setVideoEnabled: (on) => {
    const room = get()._room
    set({ videoEnabled: on })
    if (room && on) {
      void import('@/lib/webrtc').then(async ({ getMediaManager }) => {
        const m = getMediaManager()
        await m.acquire({ audio: true, video: true })
      })
    }
  },

  setIsStreaming: (v) => set({ isStreaming: v }),
  setScreenQuality: (q) => set({ screenQuality: q }),
  setScreenFps: (fps) => set({ screenFps: fps }),
  setScreenAudio: (v) => set({ screenAudio: v }),
}))

/** Convenience selector to get the active room id */
export const useActiveVoiceChannel = () =>
  useVoiceStore((s) => s.activeChannelId)

/** Convenience selector to know if a given channel is the active voice channel */
export const useIsActiveVoiceChannel = (channelId: string) =>
  useVoiceStore((s) => s.activeChannelId === channelId)