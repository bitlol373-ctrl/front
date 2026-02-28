import { Link } from 'react-router-dom'

export type AnimeCardItem = {
  id: number
  title: string
  subtitle?: string
  episodesCount: number
  poster?: string // coverUrl
  avgRating?: number
  ratingsCount?: number
  watchEpisodeId?: number
}

function resolvePoster(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url
  return `/public/${url.replace(/^public\//, '')}`
}

export default function AnimeCard({ item }: { item: AnimeCardItem }) {
  const posterSrc = resolvePoster(item.poster)
  const API = import.meta.env.VITE_API_BASE_URL
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/7">
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* poster */}
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-blue-600/15 to-violet-300/20" />
        )}

        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_30%,rgba(167,139,250,0.25),transparent_60%)]" />

        <div className="absolute left-3 top-3 rounded-xl border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/80">
          ID: {item.id}
        </div>

        <div className="absolute bottom-3 left-3 rounded-xl border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/80">
          Эпизодов: {item.episodesCount}
        </div>
      </div>

      <div className="p-4">
        <div className="font-semibold">{item.title}</div>
        {/* ⭐️ Rating */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            {item.avgRating && item.avgRating > 0 ? (
              <>
                <span className="text-yellow-400 font-semibold">
                  ⭐️ {item.avgRating.toFixed(1)}
                </span>
                <span className="text-white/40">
                  ({item.ratingsCount ?? 0})
                </span>
              </>
            ) : (
              <span className="text-white/30">Без оценок</span>
            )}
          </div>
        <div className="mt-1 line-clamp-2 text-sm text-white/60">
          {item.subtitle || 'Описание появится позже.'}
        </div>

        <div className="mt-4">
          <Link
            to={`/anime/${item.id}`}
            className="block w-full rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-violet-300 px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-90"
          >
            Открыть тайтл
          </Link>
        </div>
      </div>
    </article>
  )
}
