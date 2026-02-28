import React, { useEffect, useMemo, useRef, useState } from 'react'

type QualityOpt = { index: number; label: string }

type Props = {
  title?: string
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  error?: string
  qualities?: QualityOpt[]
  quality?: number
  onQuality?: (q: number) => void
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor((sec / 60) % 60)
  const h = Math.floor(sec / 3600)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function PlayerShell({
  title,
  videoRef,
  error,
  qualities = [],
  quality = -1,
  onQuality,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<number | null>(null)
 
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [ui, setUi] = useState(true)

  const progress = useMemo(() => {
    const base = duration > 0 ? currentTime / duration : 0
    return clamp01(seeking ? seekValue : base)
  }, [currentTime, duration, seeking, seekValue])

  const showUI = () => {
    setUi(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)

    const v = videoRef.current
    if (v && !v.paused) {
      hideTimer.current = window.setTimeout(() => setUi(false), 4000)
    }
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.playsInline = true

    const onLoadedMeta = () => {
      setReady(true)
      setDuration(Number.isFinite(v.duration) ? v.duration : 0)
      setMuted(v.muted)
      setVolume(v.volume)
    }
    const onTime = () => setCurrentTime(v.currentTime || 0)
    const onPlay = () => {
      setPaused(false)
      showUI()
    }
    const onPause = () => {
      setPaused(true)
      setUi(true)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
    const onVol = () => {
      setVolume(v.volume)
      setMuted(v.muted)
    }

    v.addEventListener('loadedmetadata', onLoadedMeta)
    v.addEventListener('durationchange', onLoadedMeta)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('volumechange', onVol)

    if (v.readyState >= 1) onLoadedMeta()

    return () => {
      v.removeEventListener('loadedmetadata', onLoadedMeta)
      v.removeEventListener('durationchange', onLoadedMeta)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('volumechange', onVol)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef])

  const togglePlay = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (v.paused) await v.play()
      else v.pause()
    } catch {}
  }

  const onSeekStart = () => {
    const v = videoRef.current
    if (!v) return
    setSeeking(true)
    setSeekValue(duration > 0 ? v.currentTime / duration : 0)
    setUi(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
  }

  const onSeekMove = (val: number) => setSeekValue(clamp01(val))

  const onSeekCommit = (val: number) => {
    const v = videoRef.current
    if (!v || !duration) {
      setSeeking(false)
      return
    }
    v.currentTime = clamp01(val) * duration
    setSeeking(false)
    showUI()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    showUI()
  }

  const setVol = (val: number) => {
    const v = videoRef.current
    if (!v) return
    const vol = clamp01(val)
    v.volume = vol
    if (vol > 0 && v.muted) v.muted = false
    showUI()
  }

  const toggleFullscreen = async () => {
    const el = wrapRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) await el.requestFullscreen()
      else await document.exitFullscreen()
    } catch {}
    showUI()
  }

  const seekBg = useMemo(() => {
    const p = Math.round(progress * 100)
    return {
      background: `linear-gradient(to right, rgba(167,139,250,0.95) ${p}%, rgba(255,255,255,0.18) ${p}%)`,
    } as React.CSSProperties
  }, [progress])

  const volBg = useMemo(() => {
    const p = Math.round(clamp01(muted ? 0 : volume) * 100)
    return {
      background: `linear-gradient(to right, rgba(96,165,250,0.95) ${p}%, rgba(255,255,255,0.18) ${p}%)`,
    } as React.CSSProperties
  }, [volume, muted])

  return (
    <section
      ref={wrapRef}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur"
      onMouseMove={showUI}
      onMouseDown={showUI}
      onTouchStart={showUI}
    >
      <div className="relative">
        <video
          ref={videoRef}
          className="block w-full bg-black"
          controls={false}
          onClick={togglePlay}
        />

        <button
          type="button"
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            ui ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          <div className="rounded-full border border-white/15 bg-black/40 px-5 py-4 shadow-[0_0_50px_rgba(124,58,237,0.18)] backdrop-blur">
            {paused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 18V6l12 6-12 6Z" fill="white" opacity="0.9" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7 6h4v12H7V6Zm6 0h4v12h-4V6Z" fill="white" opacity="0.9" />
              </svg>
            )}
          </div>
        </button>

        {/* тонкий прогресс сверху */}
        
      
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, background: 'rgba(167,139,250,0.95)' }}
          />
        </div>

        {/* нижняя панель */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
            ui ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="relative p-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              onMouseDown={onSeekStart}
              onTouchStart={onSeekStart}
              onChange={(e) => onSeekMove(Number(e.target.value))}
              onMouseUp={(e) => onSeekCommit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => onSeekCommit(Number((e.target as HTMLInputElement).value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={seekBg}
              aria-label="Seek"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-black/45"
                >
                  {paused ? 'Play' : 'Pause'}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-black/45"
                >
                  {muted || volume === 0 ? 'Mute' : 'Sound'}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(Number(e.target.value))}
                  className="h-2 w-[110px] cursor-pointer appearance-none rounded-full"
                  style={volBg}
                  aria-label="Volume"
                />

                <div className="ml-1 text-xs text-white/70 tabular-nums">
                  {fmtTime(currentTime)} / {fmtTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!!qualities.length && (
                  <select
                    value={quality}
                    onChange={(e) => onQuality?.(Number(e.target.value))}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-white/90 outline-none hover:bg-black/45"
                    aria-label="Quality"
                  >
                    {qualities.map((q) => (
                      <option key={q.index} value={q.index}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="rounded-xl border border-white/10 bg-black/35 p-2 text-white/90 hover:bg-black/45"
                  aria-label="Fullscreen"
                  title="Fullscreen"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M7 3H3v4M17 3h4v4M7 21H3v-4M21 21h-4v-4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-white/50 truncate">{title}</div>
              {!ready && !error && <div className="text-xs text-white/50">Loading…</div>}
            </div>

            {error && (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      
    </section>
  )
}
