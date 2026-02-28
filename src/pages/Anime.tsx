import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EpisodePlayer from '../ui/EpisodePlayer'
import  AnimeSocial  from '../ui/AnimeSocial'

type Episode = {
  id: number
  number: number
  title?: string
}

type AnimeResponse = {
  id: number
  title: string
  description?: string
  coverUrl?: string
  episodes: Episode[]
}

function resolveCoverSrc(url?: string) {
  if (!url) return ''
  // если уже абсолютный или начинается с /
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url
  // иначе считаем, что это файл в /public
  return `/public/${url.replace(/^public\//, '')}`
}

export default function Anime() {
  const { animeId } = useParams()
  const idNum = useMemo(() => Number(animeId || 0), [animeId])

  const [anime, setAnime] = useState<AnimeResponse | null>(null)
  const [activeEpisodeId, setActiveEpisodeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idNum) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        setAnime(null)
        setActiveEpisodeId(null)

        const res = await fetch(`${API}/anime/${idNum}`)
        if (!res.ok) throw new Error('Anime not found')

        const data: AnimeResponse = await res.json()
        setAnime(data)

        if (data.episodes?.length > 0) setActiveEpisodeId(data.episodes[0].id)
      } catch (err) {
        console.error(err)
        setAnime(null)
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [idNum])

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-white/60">Загрузка тайтла…</div>
  }

  if (!anime) {
    return <div className="flex h-64 items-center justify-center text-red-400">Аниме не найдено</div>
  }

  const coverSrc = resolveCoverSrc(anime.coverUrl)

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        {/* glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row">
          {/* COVER */}
          <div className="w-full max-w-[240px]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {coverSrc ? (
                <img src={coverSrc} alt={anime.title} className="h-full w-full object-cover" />
              ) : (
                <div className="aspect-[3/4] w-full bg-gradient-to-br from-violet-600/25 via-blue-600/15 to-violet-300/15" />
              )}
            </div>
          </div>

          {/* TEXT */}
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{anime.title}</h1>

            {anime.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">{anime.description}</p>
            ) : (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/40">Описание появится позже.</p>
            )}

            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/70">
              <span>Эпизодов:</span>
              <span className="font-semibold text-white/90">{anime.episodes.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLAYER */}
      {activeEpisodeId ? (
        <EpisodePlayer key={activeEpisodeId} episodeId={activeEpisodeId} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60 backdrop-blur">
          У этого тайтла пока нет эпизодов.
          
        </div>
        
       
      )}
       
      {/* EPISODES */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Эпизоды</h2>
          {activeEpisodeId ? (
            <div className="text-xs text-white/50">
              активный ID: <span className="text-white/80">{activeEpisodeId}</span>
            </div>
          ) : null}
          
        </div>

        {anime.episodes.length === 0 ? (
          <div className="text-sm text-white/60">Эпизоды ещё не добавлены</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {anime.episodes.map((ep) => {
              const isActive = ep.id === activeEpisodeId
              return (
                <button
                  key={ep.id}
                  onClick={() => setActiveEpisodeId(ep.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Episode {ep.number}</div>
                    {isActive ? <div className="text-xs text-violet-300">● playing</div> : null}
                  </div>

                  {ep.title ? (
                    <div className="mt-2 truncate text-xs text-white/60">{ep.title}</div>
                  ) : (
                    <div className="mt-2 truncate text-xs text-white/35">без названия</div>
                  )}
                </button>
              )
            })}
          </div>
          
        )}
      </section>
      <AnimeSocial animeId={anime.id} />
    </div>
  )
  
}
