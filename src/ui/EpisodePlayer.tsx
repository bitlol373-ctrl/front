import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import PlayerShell from './PlayerShell'

type HlsResp = { hlsPath: string }

export default function EpisodePlayer({ episodeId }: { episodeId: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [qualities, setQualities] = useState<{ index: number; label: string }[]>([])
  const [current, setCurrent] = useState<number>(-1)
  const [error, setError] = useState<string>('')

  const hlsUrl = useMemo(() => `/video/${episodeId}/hls`, [episodeId])

  useEffect(() => {
    setError('')
    setQualities([])
    setCurrent(-1)

    const video = videoRef.current
    if (!video || !episodeId) return

    // reset
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    video.pause()
    video.removeAttribute('src')
    video.load()

    let cancelled = false

    ;(async () => {
      const res = await fetch(hlsUrl)
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        if (!cancelled) setError(`GET ${hlsUrl} -> ${res.status}\n${t}`)
        return
      }

      const data = (await res.json()) as HlsResp
      const src = new URL(data.hlsPath, window.location.origin).toString()
      console.log('[EpisodePlayer] HLS src =', src)

      // 🔥 мгновенная проверка, что master.m3u8 реально доступен
      try {
        const test = await fetch(src, { method: 'GET' })
        if (!test.ok) {
          const t = await test.text().catch(() => '')
          if (!cancelled) setError(`MASTER  ${test.status}\n${src}\n\n${t}`)
          return
        }
      } catch (e) {
        if (!cancelled) setError(`MASTER fetch failed\n${src}\n${String(e)}`)
        return
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 30 * 1000 * 1000,
          backBufferLength: 30,
        })
        hlsRef.current = hls

        hls.loadSource(src)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          const opts = [{ index: -1, label: 'Auto' }].concat(
            hls.levels.map((l, idx) => ({ index: idx, label: `${l.height}p` })),
          )
          setQualities(opts)
        })

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })

        hls.on(Hls.Events.ERROR, (_, e) => {
          // покажем ПОЛЕЗНУЮ инфу: URL и HTTP code
          const url = (e as any)?.context?.url || (e as any)?.response?.url
          const code = (e as any)?.response?.code

          // если это network error — почти всегда это 404/403/CORS
          if (e?.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setError(
              [
                `NETWORK_ERROR: ${String(e.details)}`,
                code ? `HTTP: ${code}` : '',
                url ? `URL: ${url}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            )
            return
          }

          if (e?.details) setError(String(e.details))
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        video.play().catch(() => {})
      } else {
        setError('HLS не поддерживается этим браузером')
      }
    })().catch((e) => {
      if (!cancelled) setError(String(e))
    })

    return () => {
      cancelled = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [hlsUrl, episodeId])

  useEffect(() => {
    if (hlsRef.current) hlsRef.current.currentLevel = current
  }, [current])

  return (
    <PlayerShell
      videoRef={videoRef}
      title={`Episode ${episodeId}`}
      error={error}
      quality={current}
      onQuality={setCurrent}
      qualities={qualities}
    />
  )
}
