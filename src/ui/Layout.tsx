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
  const API = import.meta.env.VITE_API_BASE_URL || ''

  const [authOpen, setAuthOpen] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      const res = await fetch(`${API}/auth/me`, {
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

  useEffect(() => {
    const url = new URL(window.location.href)
    const tok = url.searchParams.get('token')

    if (tok) {
      localStorage.setItem(TOKEN_KEY, tok)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      loadMe().finally(() => setAuthOpen(false))
    } else {
      loadMe()
    }
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
        ? `${API}/auth/login`
        : `${API}/auth/register`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      setAuthError(txt || 'Ошибка авторизации')
      return
    }

    const data = await res.json().catch(() => ({} as any))
    const gotToken: string | undefined = data?.token

    if (!gotToken) {
      setAuthError(`Сервер не вернул token`)
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

  const profileLabel =
    me?.nickname || me?.email || 'Профиль'

  const googleLogin = () => {
    window.location.href = `${API}/auth/google`
  }

  return (
    <div className="min-h-screen bg-[#070611] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070611]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-violet-300" />
            <div>
              <div className="text-sm font-semibold">AniDraft</div>
              <div className="text-[11px] text-white/60">
                minimal streaming
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm text-white/70">
            <TopLink to="/">Каталог</TopLink>

            <a
              href="https://patreon.com/AniDraft"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Patreon
            </a>
{!me ? (
              <button
                onClick={() => {
                  setTab('login')
                  setAuthOpen(true)
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                Вход
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => nav('/profile')}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  {profileLabel}
                </button>

                <button
                  onClick={logout}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  Выйти
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-white/50">
        AniDraft © {new Date().getFullYear()}
      </footer>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeAuth} />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#070611]/90 p-5">
            <div className="mb-4 flex justify-between">
              <div className="text-sm font-semibold">
                Вход / регистрация
              </div>
              <button onClick={closeAuth}>Закрыть</button>
            </div>

            <div className="space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              />

              {authError && (
                <div className="text-xs text-red-400">
                  {authError}
                </div>
              )}

              <button
                onClick={submitAuth}
                className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold"
              >
                {tab === 'login'
                  ? 'Войти'
                  : 'Создать аккаунт'}
              </button>

              <button
                onClick={googleLogin}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm"
              >
                Войти через Google
              </button>

              <div className="text-[11px] text-white/50">
                {loadingMe ? 'Проверяем сессию…' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-xl px-3 py-2 transition',
          isActive
            ? 'bg-white/10 text-white'
            : 'hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}
