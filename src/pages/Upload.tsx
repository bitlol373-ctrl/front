import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function Upload() {
  const params = useParams()
  const episodeIdParam = params.episodeId

  const episodeId = useMemo(() => {
    const n = Number(episodeIdParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [episodeIdParam])

  const [file, setFile] = useState<File | null>(null)
  const [adminKey, setAdminKey] = useState<string>(() => localStorage.getItem('anidraft_admin_key') ?? '')
  const [log, setLog] = useState<string>('')

  const canUpload = Boolean(episodeId && file && adminKey.trim().length > 0)

  const upload = async () => {
    if (!episodeId) {
      setLog('Ошибка: некорректный episodeId в URL')
      return
    }
    if (!file) {
      setLog('Ошибка: выбери файл')
      return
    }
    const key = adminKey.trim()
    if (!key) {
      setLog('Ошибка: введи admin key')
      return
    }

    localStorage.setItem('anidraft_admin_key', key)

    try {
      setLog('Uploading…')

      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`http://localhost:3000/video/${episodeId}/upload`, {
        method: 'POST',
        headers: {
          'x-admin-key': key,
        },
        body: fd,
      })

      const text = await res.text()
      setLog(`Status: ${res.status}\n\n${text}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setLog(`Network error: ${msg}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 text-white">
      <h1 className="text-2xl font-semibold">Upload</h1>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-sm text-white/70">
          Episode ID:{' '}
          <span className="font-semibold text-white">
            {episodeId ?? '(invalid)'}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-xs text-white/60">Admin key</label>
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="вставь admin key…"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
          />

          <label className="mt-2 text-xs text-white/60">Видео файл</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-white/80 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
          />

          <button
            onClick={upload}
            disabled={!canUpload}
            className="mt-2 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,58,237,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Upload & Convert
          </button>
        </div>
      </div>

      <pre className="rounded-3xl border border-white/10 bg-black/30 p-4 text-xs text-white/80 whitespace-pre-wrap">
        {log || 'Логи появятся тут…'}
      </pre>
    </div>
  )
}
