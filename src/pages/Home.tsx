import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AnimeCard, { type AnimeCardItem } from '../ui/AnimeCard'

type SortMode = 'new' | 'popular' | 'episodes'
type SourceTab = 'DSTUDIO' | 'COMMUNITY'

type ApiAnime = {
  id: number
  title: string
  description?: string | null
  cover?: string | null
  episodes?: { id: number }[]
}

export default function Home() {
  const [tab, setTab] = useState<SourceTab>('DSTUDIO')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AnimeCardItem[]>([])

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('new')

  // грузим тайтлы по вкладке
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)

        const res = await fetch(`/anime?source=${tab}&sort=${sort}`)
        if (!res.ok) throw new Error(await res.text())

        const data = (await res.json()) as ApiAnime[]

        if (cancelled) return

        // пример маппинга (адаптируй под свой код)
const mapped: AnimeCardItem[] = data.map((a: any) => ({
  id: a.id,
  title: a.title,
  subtitle: a.description ?? undefined,
  episodesCount: a.episodes?.length ?? 0,
  poster: a.coverUrl ?? undefined,
  watchEpisodeId: a.episodes?.[0]?.id ?? undefined,

  // ✅ ВОТ ЭТО ВАЖНО
  avgRating: a.avgRating ?? 0,
  ratingsCount: a.ratingsCount ?? 0,
}))
      setItems(mapped)
      } catch (e) {
        console.error(e)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tab])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const base = q
      ? items.filter((a) => (a.title + ' ' + (a.subtitle || '')).toLowerCase().includes(q))
      : items.slice()

    if (sort === 'episodes') return base.sort((a, b) => b.episodesCount - a.episodesCount)
    if (sort === 'popular') return base.sort((a, b) => (b.id % 3) - (a.id % 3))
    return base.sort((a, b) => b.id - a.id)
  }, [items, query, sort])

  const topNew = filtered.slice(0, 3)

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        {/* glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-600/30 via-blue-600/20 to-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-600/20 via-violet-600/25 to-violet-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AniDraft</h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              По заказу DraftStudio для вас. С любовью AniDraft
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Pill>WIP</Pill>
              <Pill>Multi-quality</Pill>
              <Pill>Custom player</Pill>
              <Pill>Violet / Blue</Pill>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/anime/1"
                className="rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,58,237,0.18)] hover:opacity-90"
              >
                Открыть тайтл
              </Link>
            </div>
          </div>

          {/* stats */}
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <Stat title="Каталог" value={tab === 'DSTUDIO' ? 'dStudio' : 'Остальное'} hint="переключайте вкладкой" />
            <Stat title="Тайтлов" value={loading ? '...' : String(items.length)} hint="из базы" />
            <Stat title="UI" value="Minimal" hint="Purple Glass" />
          </div>
        </div>
        {/* Tabs + Search + sort */}
        <div className="relative mt-7 grid gap-3 lg:grid-cols-12">
          {/* tabs */}
          <div className="lg:col-span-4">
            <div className="flex w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070611]/40 p-1">
              <TabBtn active={tab === 'DSTUDIO'} onClick={() => setTab('DSTUDIO')}>
                dStudio
              </TabBtn>
              <TabBtn active={tab === 'COMMUNITY'} onClick={() => setTab('COMMUNITY')}>
                Остальные
              </TabBtn>
            </div>
          </div>

          {/* search */}
          <div className="lg:col-span-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по тайтлам…"
              className="w-full rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-violet-400/40"
            />
          </div>

          {/* sort */}
          <div className="lg:col-span-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="w-full rounded-2xl border border-white/10 bg-[#070611]/40 px-4 py-3 text-sm text-white/90 outline-none focus:border-violet-400/40"
            >
              <option value="new">Сортировка: новые</option>
              <option value="popular">Сортировка: популярные</option>
              <option value="episodes">Сортировка: по эпизодам</option>
            </select>
          </div>
        </div>
      </section>

      {/* NEW */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Новые</h2>
          <div className="text-xs text-white/50">
            {loading ? 'загрузка…' : `${topNew.length} из ${filtered.length}`}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
            Подгружаем каталог…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topNew.map((item) => (
              <AnimeCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ALL */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Все тайтлы</h2>
          <div className="text-xs text-white/50">
            {loading ? '...' : filtered.length === 0 ? 'ничего не найдено' : `найдено: ${filtered.length}`}
          </div>
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
            Ничего не нашёл по запросу. Попробуй другое слово.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <AnimeCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  )
}

function Stat({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-[11px] text-white/50">{hint}</div>
    </div>
  )
}
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition',
        active
          ? 'bg-white/10 text-white shadow-[0_0_30px_rgba(124,58,237,0.12)]'
          : 'text-white/70 hover:bg-white/5 hover:text-white',
      ].join(' ')}
      type="button"
    >
      {children}
    </button>
  )
}
