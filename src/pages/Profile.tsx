import { useEffect, useMemo, useState } from 'react'

type Me = {
  id: number
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
}

export default function Profile() {
  const tokenKey = 'anidraft_token'
  const token = useMemo(() => localStorage.getItem(tokenKey) || '', [])
  
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const loadMe = async () => {
    if (!token) {
      setMe(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setMsg('')
   
    const res = await fetch('https://anidrtst.onrender.com/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      setMe(null)
      setLoading(false)
      return
    }
    const data = (await res.json()) as Me
    setMe(data)
    setNickname(data.nickname || '')
    setBio(data.bio || '')
    setAvatarUrl(data.avatarUrl || '')
    setLoading(false)
  }

  useEffect(() => {
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    if (!token) return
    setSaving(true)
    setMsg('')
   
    const res = await fetch('${API}/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nickname: nickname.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      }),
    })

    const text = await res.text()

    if (!res.ok) {
      setSaving(false)
      // если ник занят — бэк вернёт "nickname already used"
      setMsg(text)
      return
    }

    const updated = JSON.parse(text) as Me
    setMe(updated)
    setMsg('Сохранено ✅')
    setSaving(false)
  }

  if (loading) {
    return <div className="text-white/60">Загрузка профиля…</div>
  }

  if (!me) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70 backdrop-blur">
        Ты не авторизован. Зайди через кнопку вверху.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="w-full md:w-[260px]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-violet-600/30 via-blue-600/20 to-violet-300/20" />
              )}
            </div>

            <div className="mt-3 text-xs text-white/50">
              Email: <span className="text-white/80">{me.email}</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="text-xs text-white/60">Ник (уникальный)</div>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="например: polkovnik"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
              />
              <div className="mt-2 text-[11px] text-white/45">
                Ник не должен совпадать с никами других пользователей.
              </div>
            </div>

            <div>
              <div className="text-xs text-white/60">Аватар (URL)</div>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
              />
            </div>

            <div>
              <div className="text-xs text-white/60">Био</div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Пара слов о себе…"
                className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Сохраняю…' : 'Сохранить'}
              </button>

              {msg ? <div className="text-xs text-white/70">{msg}</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
