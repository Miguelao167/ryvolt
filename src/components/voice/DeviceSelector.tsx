'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Camera, Volume2, X } from 'lucide-react'
import { getMediaManager, type MediaDeviceInfo } from '@/lib/webrtc'
import { cn } from '@/lib/utils'

interface DeviceSelectorProps {
  onClose: () => void
}

export function DeviceSelector({ onClose }: DeviceSelectorProps) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([])
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedOutput, setSelectedOutput] = useState<string>('')
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    let mounted = true
    async function load() {
      const media = getMediaManager()
      const [mics, cams, speakers] = await Promise.all([
        media.getDevices('audioinput'),
        media.getDevices('videoinput'),
        media.getDevices('audiooutput'),
      ])
      if (!mounted) return
      setInputs(mics)
      setCameras(cams)
      setSpeakers(speakers)
      if (mics[0]) setSelectedMic(mics[0].deviceId)
      if (cams[0]) setSelectedCamera(cams[0].deviceId)
      if (speakers[0]) setSelectedOutput(speakers[0].deviceId)
    }
    load()

    const handler = () => load()
    navigator.mediaDevices?.addEventListener?.('devicechange', handler)
    return () => {
      mounted = false
      navigator.mediaDevices?.removeEventListener?.('devicechange', handler)
    }
  }, [])

  async function apply(kind: 'audioinput' | 'videoinput', deviceId: string) {
    try {
      await getMediaManager().switchDevice(kind, deviceId)
    } catch (err) {
      console.error('failed to switch device', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'p-4 rounded-2xl shadow-2xl',
        'bg-discord-surface/95 backdrop-blur-xl',
        'border border-discord-deep',
        'space-y-4',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Audio & Video
        </h3>
        <button
          onClick={onClose}
          className="text-discord-text-dim hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Microphone */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-discord-text-dim mb-1">
          <Mic className="w-3 h-3" />
          Microphone
        </label>
        <select
          value={selectedMic}
          onChange={(e) => {
            setSelectedMic(e.target.value)
            void apply('audioinput', e.target.value)
          }}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-discord-bg text-white',
            'border border-discord-deep focus:border-discord-blurple',
            'outline-none',
          )}
        >
          {inputs.length === 0 && <option value="">No microphones detected</option>}
          {inputs.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-discord-text-dim mb-1">
          <Camera className="w-3 h-3" />
          Camera
        </label>
        <select
          value={selectedCamera}
          onChange={(e) => {
            setSelectedCamera(e.target.value)
            void apply('videoinput', e.target.value)
          }}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-discord-bg text-white',
            'border border-discord-deep focus:border-discord-blurple',
            'outline-none',
          )}
        >
          {cameras.length === 0 && <option value="">No cameras detected</option>}
          {cameras.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Output device (speakers) */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-discord-text-dim mb-1">
          <Volume2 className="w-3 h-3" />
          Speaker
        </label>
        <select
          value={selectedOutput}
          onChange={(e) => setSelectedOutput(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-discord-bg text-white',
            'border border-discord-deep focus:border-discord-blurple',
            'outline-none',
          )}
        >
          {speakers.length === 0 && <option value="">Default</option>}
          {speakers.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Volume slider */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-discord-text-dim mb-1">
          <Volume2 className="w-3 h-3" />
          Volume ({Math.round(volume * 100)}%)
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-discord-blurple"
        />
      </div>
    </motion.div>
  )
}