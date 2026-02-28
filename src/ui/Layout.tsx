import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

type Me = {
  id: number
  email: string
  nickname?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

const TOKEN_KEY = 'anidraft_token'

export default function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()

  const [authOpen, setAuthOpen] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const API = import.meta.env.VITE_API_BASE_URL
  const [authError, setAuthError] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [loadingMe, setLoadingMe] = useState(false)

  const authHeaders = (tok: string): HeadersInit => ({
    Authorization: `Bearer ${tok}`,
  })

  const loadMe = async () => {
    const tok = localStorage.getItem(TOKEN_KEY)
    if (!tok) {
      setMe(null)
      return
    }

    setLoadingMe(true)
    try {
      const res = await fetch('${API}/auth/me', {
        headers: authHeaders(tok),
      })

      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY)
        setMe(null)
        return
      }

      const data = (await res.json()) as Me
      setMe(data)
    } finally {
      setLoadingMe(false)
    }
  }

  // принять token из ?token=... (после Google redirect)
  useEffect(() => {
    const url = new URL(window.location.href)
    const tok = url.searchParams.get('token')
    if (tok) {
      localStorage.setItem(TOKEN_KEY, tok)
      url.searchParams.delete('token')
      url.searchParams.delete('auth')
      window.history.replaceState({}, '', url.toString())
      loadMe().finally(() => setAuthOpen(false))
    } else {
      loadMe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeAuth = () => {
    setAuthOpen(false)
    setAuthError('')
    setPassword('')
  }

  const submitAuth = async () => {
    setAuthError('')

    if (!email.trim() || !password.trim()) {
      setAuthError('Введите email и пароль')
      return
    }

    const url =
      tab === 'login'
        ? 'http://localhost:3000/auth/login'
        : 'http://localhost:3000/auth/register'

    const body = { email: email.trim(), password }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      setAuthError(txt || 'Ошибка авторизации')
      return
    }

    const data = await res.json().catch(() => ({} as any))
    const gotToken: string | undefined = data?.token

    if (!gotToken) {
      setAuthError(`Сервер не вернул token.\nОтвет сервера:\n${JSON.stringify(data)}`)
      return
    }

    localStorage.setItem(TOKEN_KEY, gotToken)
    await loadMe()
    closeAuth()
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setMe(null)
  }

  const profileLabel = me?.nickname || me?.email || 'Профиль'

  const googleLogin = () => {
    // стартуем OAuth на бэке
    window.location.href = 'http://localhost:3000/auth/google'
  }

  return (
    <div className="min-h-screen bg-[#070611] text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-44 -left-44 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-violet-600/30 via-blue-600/20 to-violet-300/20 blur-3xl" />
        <div className="absolute -bottom-44 -right-44 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-blue-600/20 via-violet-600/25 to-violet-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,rgba(255,255,255,0.03)_1px)] [background-size:18px_18px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070611]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-violet-300 shadow-[0_0_30px_rgba(124,58,237,0.25)]" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">AniDraft</div>
              <div className="text-[11px] text-white/60">minimal streaming</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm text-white/70">
            <TopLink to="/">Каталог</TopLink>
<a
  href="https://patreon.com/AniDraft?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
  target="_blank"
  rel="noreferrer"
  className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,58,237,0.18)] hover:opacity-90"
  title="Поддержать Draft Studio на Patreon"
>
  Patreon
</a>

            {!me ? (
              <button
                onClick={() => {
                  setTab('login')
                  setAuthOpen(true)
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                title="Вход"
              >
                Вход
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => nav('/profile')}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  title="Профиль"
                >
                  <span className="relative h-6 w-6 overflow-hidden rounded-xl border border-white/10 bg-white/10">
                    {me.avatarUrl ? (
                      <img
                        src={me.avatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-white/70">
                        {String((me.nickname || me.email || 'U')[0]).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="max-w-[160px] truncate">{profileLabel}</span>
                </button>

                <button
                  onClick={logout}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                  title="Выйти"
                >
                  Выйти
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-white/50">
        AniDraft © {new Date().getFullYear()}
      </footer>

      {/* AUTH MODAL */}
      {authOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/60" onClick={closeAuth} aria-label="Close" />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#070611]/80 p-5 backdrop-blur">
            <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-52 w-52 rounded-full bg-blue-600/15 blur-3xl" />

            <div className="relative">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Аккаунт</div>
                  <div className="text-xs text-white/60">Вход / регистрация</div>
                </div>
                <button
                  onClick={closeAuth}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Закрыть
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                <button
                  onClick={() => setTab('login')}
                  className={cx(
                    'rounded-xl px-3 py-2 text-xs font-semibold transition',
                    tab === 'login' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  Вход
                </button>
                <button
                  onClick={() => setTab('register')}
                  className={cx(
                    'rounded-xl px-3 py-2 text-xs font-semibold transition',
                    tab === 'register' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  Регистрация
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-white/10 bg-[#070611]/50 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-[#070611]/50 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
                />

                {authError ? (
                  <pre className="whitespace-pre-wrap rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                    {authError}
                  </pre>
                ) : null}

                <button
                  onClick={submitAuth}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,58,237,0.18)] hover:opacity-90"
                >
                  {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
                </button>

                <button
                  onClick={googleLogin}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  Войти через Google
                </button>

                <div className="text-[11px] text-white/50">{loadingMe ? 'Проверяем сессию…' : ' '}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-xl px-3 py-2 transition',
          isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ')
}
