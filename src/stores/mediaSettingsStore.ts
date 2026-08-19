'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Persisted user preferences for voice / video. Saved to localStorage so
 * devices survive reloads.
 */
export type InputProfile = 'voice-isolation' | 'studio' | 'custom'

export interface MediaSettings {
  /** Specific input device id, or null for system default */
  micDeviceId: string | null
  /** Specific output device id, or null for system default */
  speakerDeviceId: string | null
  /** Specific camera device id, or null for system default */
  cameraDeviceId: string | null

  /** Mic input gain (0..1) — applied as track gain via Web Audio */
  inputVolume: number
  /** Speaker output volume (0..1) — applied via sink outputVolume */
  outputVolume: number

  /** Input processing profile (controls the toggles below) */
  inputProfile: InputProfile

  /** Browser-level echo cancellation */
  echoCancellation: boolean
  /** Browser-level noise suppression */
  noiseSuppression: boolean
  /** Browser-level auto gain (control automatic gain for input) */
  autoGainControl: boolean

  /** Sensitivity for "speaking" detection. 0..1, lower = more sensitive */
  speakingThreshold: number
  /** Use advanced voice activity detection (browser-managed) */
  advancedVoiceDetect: boolean
  /** Bypass the OS audio processing pipeline (browser hint) */
  bypassSystemProcessing: boolean

  /** Whether to push-to-talk instead of open mic */
  pushToTalk: boolean

  /** Notify when no audio is detected */
  noAudioNotify: boolean
  /** Confirm before joining a different voice channel */
  channelSwitchConfirm: boolean

  /** Reduce volume of other apps when speaking (0..100) */
  attenuation: number
  /** Attenuate other apps when self speaks */
  attenuateWhenSelf: boolean
  /** Attenuate other apps when others speak */
  attenuateWhenOthers: boolean

  /** Report to router that packets are high priority (QoS hint) */
  qosHighPriority: boolean
}

interface MediaSettingsState extends MediaSettings {
  setMicDevice: (id: string | null) => void
  setSpeakerDevice: (id: string | null) => void
  setCameraDevice: (id: string | null) => void
  setInputVolume: (v: number) => void
  setOutputVolume: (v: number) => void
  setInputProfile: (p: InputProfile) => void
  setEchoCancellation: (v: boolean) => void
  setNoiseSuppression: (v: boolean) => void
  setAutoGainControl: (v: boolean) => void
  setSpeakingThreshold: (v: number) => void
  setAdvancedVoiceDetect: (v: boolean) => void
  setBypassSystemProcessing: (v: boolean) => void
  setPushToTalk: (v: boolean) => void
  setNoAudioNotify: (v: boolean) => void
  setChannelSwitchConfirm: (v: boolean) => void
  setAttenuation: (v: number) => void
  setAttenuateWhenSelf: (v: boolean) => void
  setAttenuateWhenOthers: (v: boolean) => void
  setQosHighPriority: (v: boolean) => void
}

const DEFAULTS: MediaSettings = {
  micDeviceId: null,
  speakerDeviceId: null,
  cameraDeviceId: null,
  inputVolume: 1,
  outputVolume: 1,
  inputProfile: 'voice-isolation',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  speakingThreshold: 0.02,
  advancedVoiceDetect: true,
  bypassSystemProcessing: true,
  pushToTalk: false,
  noAudioNotify: true,
  channelSwitchConfirm: true,
  attenuation: 0,
  attenuateWhenSelf: false,
  attenuateWhenOthers: true,
  qosHighPriority: false,
}

/** Default toggle values per input profile. */
export const PROFILE_DEFAULTS: Record<InputProfile, Pick<MediaSettings, 'echoCancellation' | 'noiseSuppression' | 'autoGainControl' | 'advancedVoiceDetect' | 'bypassSystemProcessing'>> = {
  'voice-isolation': {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    advancedVoiceDetect: true,
    bypassSystemProcessing: true,
  },
  studio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    advancedVoiceDetect: false,
    bypassSystemProcessing: false,
  },
  custom: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    advancedVoiceDetect: true,
    bypassSystemProcessing: true,
  },
}

export const useMediaSettingsStore = create<MediaSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMicDevice: (id) => set({ micDeviceId: id }),
      setSpeakerDevice: (id) => set({ speakerDeviceId: id }),
      setCameraDevice: (id) => set({ cameraDeviceId: id }),
      setInputVolume: (v) => set({ inputVolume: Math.max(0, Math.min(1, v)) }),
      setOutputVolume: (v) => set({ outputVolume: Math.max(0, Math.min(1, v)) }),
      setInputProfile: (p) =>
        set({
          inputProfile: p,
          ...PROFILE_DEFAULTS[p],
        }),
      setEchoCancellation: (v) => set({ echoCancellation: v, inputProfile: 'custom' }),
      setNoiseSuppression: (v) => set({ noiseSuppression: v, inputProfile: 'custom' }),
      setAutoGainControl: (v) => set({ autoGainControl: v, inputProfile: 'custom' }),
      setSpeakingThreshold: (v) => set({ speakingThreshold: Math.max(0, Math.min(1, v)) }),
      setAdvancedVoiceDetect: (v) => set({ advancedVoiceDetect: v, inputProfile: 'custom' }),
      setBypassSystemProcessing: (v) => set({ bypassSystemProcessing: v, inputProfile: 'custom' }),
      setPushToTalk: (v) => set({ pushToTalk: v }),
      setNoAudioNotify: (v) => set({ noAudioNotify: v }),
      setChannelSwitchConfirm: (v) => set({ channelSwitchConfirm: v }),
      setAttenuation: (v) => set({ attenuation: Math.max(0, Math.min(100, v)) }),
      setAttenuateWhenSelf: (v) => set({ attenuateWhenSelf: v }),
      setAttenuateWhenOthers: (v) => set({ attenuateWhenOthers: v }),
      setQosHighPriority: (v) => set({ qosHighPriority: v }),
    }),
    { name: 'ryvolt-media-settings' },
  ),
)
