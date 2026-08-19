'use client'

import { useEffect, useState } from 'react'

export interface MediaDeviceLite {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput' | 'videoinput'
}

/**
 * Lists connected media devices, refreshes when devices change.
 * Triggers a permission prompt by enumerating once on mount (browsers
 * only return labels after permission has been granted at least once).
 */
export function useMediaDevices(kind?: MediaDeviceLite['kind']) {
  const [devices, setDevices] = useState<MediaDeviceLite[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setReady(true)
      return
    }

    const update = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const filtered = list
          .filter((d) => !kind || d.kind === kind)
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `${d.kind} (${d.deviceId.slice(0, 6)}…)`,
            kind: d.kind as MediaDeviceLite['kind'],
          }))
        setDevices(filtered)
      } catch (err) {
        console.warn('[useMediaDevices] enumerateDevices failed:', err)
      } finally {
        setReady(true)
      }
    }

    void update()
    navigator.mediaDevices.addEventListener('devicechange', update)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', update)
    }
  }, [kind])

  return { devices, ready }
}
