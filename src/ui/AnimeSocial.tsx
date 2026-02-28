import { useEffect, useMemo, useState } from 'react'

type CommentItem = {
  id: number
  text: string
  createdAt: string
  user: { id: number; nickname: string; avatarUrl: string | null }
}

type SocialResp = {
  avgRating: number | null
  ratingsCount: number
  myRating: number | null
  comments: CommentItem[]
}

export function AnimeSocial({ animeId }: { animeId: number }) {
  const tokenKey = 'anidraft_token'
 
  const token = useMemo(() => localStorage.getItem(tokenKey) || '', [])
  const authHeaders = useMemo((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [token])

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [ratingsCount, setRatingsCount] = useState<number>(0)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])

  const [ratingValue, setRatingValue] = useState<number>(8)
  const [commentText, setCommentText] = useState<string>('')

  const isAuthed = !!token

  const load = async () => {
    try {
      setErr('')
      setLoading(true)

      const res = await fetch(`${API}/anime/${animeId}/social`, {
        headers: { ...authHeaders },
      })

      if (!res.ok) {
        setErr(await res.text())
        setLoading(false)
        return
      }
const data = (await res.json()) as SocialResp
      setAvgRating(data.avgRating)
      setRatingsCount(data.ratingsCount)
      setMyRating(data.myRating)
      setComments(data.comments || [])
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!animeId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId])

  const submitRating = async () => {
    if (!isAuthed) {
      setErr('Войдите или зарегистрируйтесь, чтобы ставить оценку')
      return
    }

    setErr('')
    const res = await fetch(`${API}/anime/${animeId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ value: ratingValue }),
    })

    if (!res.ok) {
      setErr(await res.text())
      return
    }

    await load()
  }

  const submitComment = async () => {
    if (!isAuthed) {
      setErr('Войдите или зарегистрируйтесь, чтобы писать комментарии')
      return
    }

    const text = commentText.trim()
    if (text.length < 2) {
      setErr('Комментарий слишком короткий')
      return
    }

    setErr('')
    const res = await fetch(`${API}/anime/${animeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      setErr(await res.text())
      return
    }

    setCommentText('')
    await load()
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Оценки и комментарии</div>
          <div className="mt-1 text-sm text-white/60">
            Средняя оценка:{' '}
            <span className="text-white">
              {avgRating == null ? '—' : avgRating.toFixed(1)}
            </span>{' '}
            <span className="text-white/40">({ratingsCount})</span>
            {myRating != null ? (
              <span className="ml-2 text-white/60">
                • твоя: <span className="text-white">{myRating}</span>
              </span>
            ) : null}
          </div>
        </div>
<div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-white/10 bg-[#070611]/60 px-3 py-2 text-xs text-white/90 outline-none"
            value={ratingValue}
            onChange={(e) => setRatingValue(Number(e.target.value))}
            disabled={!isAuthed}
            title={!isAuthed ? 'Войдите или зарегистрируйтесь, чтобы ставить оценку' : ''}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}/10
              </option>
            ))}
          </select>

          <button
            onClick={submitRating}
            disabled={!isAuthed}
            className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Поставить
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold">Комментарий</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={isAuthed ? 'Напиши что думаешь…' : 'Войдите или зарегистрируйтесь, для того чтобы комментировать'}
            disabled={!isAuthed}
            className="w-full flex-1 rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40 disabled:opacity-60"
          />
          <button
            onClick={submitComment}
            disabled={!isAuthed}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:opacity-50"
          >
            Отправить
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-white/60">Загрузка…</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-white/60">Комментариев пока нет.</div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {c.user.avatarUrl ? (
                    <img
                      src={c.user.avatarUrl}
                      alt={c.user.nickname}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.user.nickname}</div>
                  <div className="text-[11px] text-white/50">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-white/80">{c.text}</div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default AnimeSocial
