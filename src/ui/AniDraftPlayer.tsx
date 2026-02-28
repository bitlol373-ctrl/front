import { useEffect, useMemo, useRef, useState } from 'react'

type QualityOption = { index: number; label: string }

function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AniDraftPlayer({
  title,
  videoRef,
  error,
  qualities,
  quality,
  onQuality,
}: {
  title: string
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  error?: string
  qualities: QualityOption[]
  quality: number
  onQuality: (v: number) => void
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [vol, setVol] = useState(0.9)

  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)

  const [showUI, setShowUI] = useState(true)
  const hideTimer = useRef<number | null>(null)

  const progress = useMemo(() => {
    if (!dur) return 0
    return Math.min(1, Math.max(0, cur / dur))
  }, [cur, dur])

  const pingUI = () => {
    setShowUI(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setShowUI(false), 1800)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    // базовые настройки
    v.controls = false

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCur(v.currentTime || 0)
    const onMeta = () => setDur(v.duration || 0)
    const onVol = () => {
      setMuted(v.muted)
      setVol(v.volume)
    }

    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('durationchange', onMeta)
    v.addEventListener('volumechange', onVol)

    // стартовое
    onVol()
    pingUI()

    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('durationchange', onMeta)
      v.removeEventListener('volumechange', onVol)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [videoRef])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    pingUI()
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    pingUI()
    v.muted = !v.muted
  }

  const setVolume = (x: number) => {
    const v = videoRef.current
    if (!v) return
    pingUI()
    v.volume = Math.min(1, Math.max(0, x))
    if (v.volume > 0) v.muted = false
  }

  const seekTo = (clientX: number) => {
    const v = videoRef.current
    const wrap = wrapRef.current
    if (!v || !wrap || !dur) return

    const rect = wrap.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const t = Math.min(1, Math.max(0, x)) * dur
    v.currentTime = t
  }

  const onBarDown = (e: React.MouseEvent) => {
    pingUI()
    seekTo(e.clientX)

    const onMove = (ev: MouseEvent) => seekTo(ev.clientX)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <section
      onMouseMove={pingUI}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(124,58,237,0.14)] backdrop-blur"
    >
      {/* glow blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />

      {/* video */}
      <div className="relative">
        <video
          ref={videoRef}
          className="block h-auto w-full bg-black"
          playsInline
        />

        {/* click-to-toggle */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 cursor-pointer"
          aria-label="toggle play"
          style={{ background: 'transparent' }}
        />

        {/* top glass header */}
        <div
          className={`absolute left-0 right-0 top-0 p-4 transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#070611]/35 px-4 py-3 backdrop-blur-xl">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white/90">
                {title}
              </div>
              <div className="text-xs text-white/55">AniDraft • liquid glass</div>
            </div>

            <select
              className="rounded-xl border border-white/10 bg-[#070611]/50 px-3 py-2 text-xs text-white/90 outline-none"
              value={quality}
              onChange={(e) => onQuality(Number(e.target.value))}
              disabled={qualities.length === 0}
              onClick={(e) => e.stopPropagation()}
            >
              {(qualities.length ? qualities : [{ index: -1, label: 'Auto' }]).map((q) => (
                <option key={q.index} value={q.index}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* bottom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="rounded-2xl border border-white/10 bg-[#070611]/40 p-4 backdrop-blur-xl">
            {/* progress */}
            <div
              ref={wrapRef}
              onMouseDown={onBarDown}
              className="group relative h-3 cursor-pointer select-none"
            >
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
              <div
                className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-500 via-blue-500 to-violet-200"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(124,58,237,0.55)] opacity-0 transition-opacity group-hover:opacity-100"
                style={{ left: `calc(${progress * 100}% - 6px)` }}
              />
            </div>

            {/* buttons row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                  className="rounded-xl bg-linear-to-r from-violet-600 via-blue-600 to-violet-300 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  {playing ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute()
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  {muted ? 'Unmute' : 'Mute'}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : vol}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="h-2 w-28 accent-violet-400"
                />
              </div>

              <div className="text-xs text-white/60 tabular-nums">
                {fmtTime(cur)} / {fmtTime(dur)}
              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
