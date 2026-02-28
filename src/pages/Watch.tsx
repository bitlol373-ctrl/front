import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Hls from 'hls.js'
import PlayerShell from '../ui/PlayerShell'

type HlsResp = { hlsPath: string }

export default function Watch() {
  const { episodeId } = useParams()
  const id = Number(episodeId || 0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const API = import.meta.env.VITE_API_BASE_URL || ''

  const [qualities, setQualities] = useState<
    { index: number; label: string }[]
  >([])
  const [current, setCurrent] = useState<number>(-1)
  const [error, setError] = useState<string>('')

  const hlsUrl = useMemo(() => {return ${API}/video/${id}/hls}, [API, id]);

  useEffect(() => {
    setError('')
    setQualities([])
    setCurrent(-1)

    const video = videoRef.current
    if (!video || !id) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    ;(async () => {
      const res = await fetch(hlsUrl)
      if (!res.ok) {
        setError(await res.text())
        return
      }

      const data = (await res.json()) as HlsResp
      const src = data.hlsPath

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

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })

        hls.on(Hls.Events.MANIFEST_LOADED, () => {
          const opts = [{ index: -1, label: 'Auto' }].concat(
            hls.levels.map((l, idx) => ({
              index: idx,
              label: `${l.height}p`,
            })),
          )
          setQualities(opts)
        })

        hls.on(Hls.Events.ERROR, (_, e) => {
          if (e?.details === Hls.ErrorDetails.BUFFER_FULL_ERROR) {
            try {
              const v = videoRef.current
              if (v && Number.isFinite(v.currentTime))
                v.currentTime = v.currentTime + 0.01
            } catch {}
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
    })()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [hlsUrl, id])

  useEffect(() => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = current
    }
  }, [current])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold">Просмотр</h2>
        <p className="mt-1 text-sm text-white/60">Episode {id}</p>
      </section>

      <PlayerShell
        videoRef={videoRef}
        title={`Episode ${id}`}
        error={error}
        quality={current}
        onQuality={(v) => setCurrent(v)}
        qualities={qualities}
      />
    </div>
  )
}
