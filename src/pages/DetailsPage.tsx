import { useState, useEffect } from 'react';
import { Play, ChevronLeft, Star, Clock, Users, User, PlayCircle } from 'lucide-react';
import { ContentItem } from '../types';
import { ContentPoster } from '../components/ContentPoster';
import { tmdbService, TMDBMovie } from '../services/tmdb.service';
import { xtreamService } from '../services/xtream.service';
import { DetailsSeriesPage } from './DetailsSeriesPage';
import { API_BASE_URL } from '../config/api';

interface DetailsPageProps {
  item: ContentItem;
  favorites: string[];
  onToggleFavorite: (id: string, type?: 'TV' | 'MOVIE' | 'SERIES') => void;
  onBack: () => void;
  isTV?: boolean;
  onPlay?: (items: { url: string; title: string; streamId: string; contentType: 'TV' | 'MOVIE' | 'SERIES' | 'EPISODE'; seriesId?: string; seasonId?: string; episodeNum?: number; startAt?: number; }[], index: number) => void;
  refreshTrigger?: number;
}

/**
 * Página de Detalhes
 * Exibe informações detalhadas sobre um Filme ou Série.
 * Inclui busca automática no TMDB para enriquecer metadados.
 */
export function DetailsPage({ item, favorites, onToggleFavorite, onBack, isTV, onPlay, refreshTrigger }: DetailsPageProps) {
  const isFavorite = favorites.includes(item.id);
  const [tmdbData, setTmdbData] = useState<TMDBMovie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [lastProgress, setLastProgress] = useState<any | null>(null);

  // Busca progresso recente (Séries ou Filmes)
  useEffect(() => {
    if (!onPlay) return;

    async function fetchItemProgress() {
      try {
        const token = localStorage.getItem('streamview-auth-storage') 
          ? JSON.parse(localStorage.getItem('streamview-auth-storage') || '{}').state?.token 
          : null;
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          if (item.type === 'Series') {
            const seriesProg = data.data
              .filter((p: any) => p.seriesId === String(item.id))
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            setLastProgress(seriesProg || null);
          } else {
            const movieProg = data.data.find((p: any) => p.streamId === String(item.id));
            setLastProgress(movieProg || null);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar progresso:', err);
      }
    }

    fetchItemProgress();
  }, [item.id, refreshTrigger]);

  // Busca informações adicionais no TMDB para Filmes e Séries
  useEffect(() => {
    if (item.type === 'TV') return;

    async function enrichContent() {
      setIsLoading(true);
      try {
        const isSeries = item.type === 'Series';
        const basic = await tmdbService.searchContent(item.name, isSeries);

        if (basic && basic.id) {
          const full = await tmdbService.getFullDetails(basic.id, isSeries);
          if (full) {
            setTmdbData(full);
          }
        }
      } catch (err) {
        console.error('[TMDB] Erro ao enriquecer detalhes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    enrichContent();
  }, [item.name, item.type]);

  // Valores priorizados (TMDB > IPTV)
  const displayDescription = tmdbData?.overview || item.description;
  const displayRating = tmdbData?.vote_average || item.rating;
  const displayYear = tmdbData?.release_date?.split('-')[0] || tmdbData?.first_air_date?.split('-')[0] || item.year;
  const genres = tmdbData?.genres?.map(g => g.name).join(', ') || item.category;
  const director = tmdbData?.credits?.crew?.find(c => c.job === 'Director')?.name || item.director;
  const cast = tmdbData?.credits?.cast?.slice(0, 8) || []; // Pegamos os 8 primeiros atores

  return (
    <div className={`animate-in fade-in duration-500 pb-20 sm:pb-32 ${isTV ? 'pb-40' : ''}`}>
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar</span>
      </button>

      {/* Container Principal */}
      <div className="flex flex-wrap lg:flex-nowrap gap-12 items-start justify-start">

        {/* Coluna da Esquerda: Poster e Progresso */}
        <div className={`shrink-0 space-y-6 ${isTV ? 'w-[350px]' : 'w-full lg:w-[350px]'}`}>
          <ContentPoster
            name={item.name}
            type={item.type}
            fallbackUrl={item.imageUrl}
            aspect="poster"
            className="w-full border border-[#121212] shadow-2xl overflow-hidden"
            imageClassName="group-hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Badge de Categoria */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-[#121212] rounded-sm text-[10px] font-bold tracking-widest uppercase text-white/80">
              {item.category}
            </div>
          </ContentPoster>

          {/* Barra de Progresso para Filmes */}
          {item.type === 'Movie' && item.progress !== undefined && item.progress > 0 && (
            <div className="bg-[#121212] border border-[#121212] p-5 rounded-sm space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5 uppercase tracking-widest font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  Progresso
                </span>
                <span className="text-white/60 font-mono italic">{item.progress}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-1000"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Info, Play e Episódios */}
        <div className="flex-1 space-y-12">
          {/* Cabeçalho e Título */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-bold text-white/20 uppercase tracking-[0.3em]">{genres}</p>
              <div className="flex items-center gap-6">
                <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-none">
                  {item.name}
                </h1>
                <button
                  onClick={() => {
                    const typeMap: Record<string, 'TV' | 'MOVIE' | 'SERIES'> = {
                      'Movie': 'MOVIE',
                      'Series': 'SERIES',
                      'TV': 'TV'
                    };
                    onToggleFavorite(item.id, typeMap[item.type] || 'MOVIE');
                  }}
                  className={`p-4 rounded-full border transition-all hover:scale-110 active:scale-90 ${isFavorite
                    ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/20 hover:text-white/60 hover:border-white/20'
                    }`}
                >
                  <Star className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Badges de Informações Dinâmicas */}
            <div className="flex items-center gap-6 py-2">
              {/* Pontuação do TMDB/API */}
              {!!displayRating && (
                <div className="flex items-center gap-2 text-yellow-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{typeof displayRating === 'number' ? displayRating.toFixed(1) : displayRating}</span>
                </div>
              )}

              {/* Ano e Metadados Disponíveis */}
              <div className="text-white/40 text-sm font-medium uppercase tracking-widest flex items-center gap-4">
                {displayYear && (
                  <span className="border-l border-white/10 pl-4">{displayYear}</span>
                )}
                {director && (
                  <span className="border-l border-white/10 pl-4 flex items-center gap-1.5 whitespace-nowrap">
                    <User className="w-3.5 h-3.5" /> Dir. {director}
                  </span>
                )}
                <span className="px-2 py-0.5 border border-white/10 rounded-sm text-[10px]">4K HD</span>
              </div>
            </div>

            <p className="text-2xl text-white/80 leading-relaxed max-w-5xl font-light">
              {displayDescription || 'Nenhuma descrição disponível.'}
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center gap-6">
              <button 
                onClick={() => {
                  if (item.type === 'Series') {
                    setShowEpisodesModal(true);
                  } else if (onPlay) {
                    const type = item.type === 'TV' ? 'live' : 'movie';
                    const ext = item.type === 'TV' ? 'm3u8' : 'mp4';
                    const url = xtreamService.getStreamUrl(item.id, type, ext);
                    const contentTypeMap: Record<string, 'TV' | 'MOVIE' | 'SERIES'> = {
                      'TV': 'TV', 'Movie': 'MOVIE', 'Series': 'SERIES'
                    };
                    onPlay([{
                      url,
                      title: item.name,
                      streamId: String(item.id),
                      contentType: contentTypeMap[item.type] || 'MOVIE',
                      startAt: lastProgress ? lastProgress.progressSecs : 0
                    }], 0);
                  }
                }}
                className={`w-fit bg-white text-black font-black flex items-center justify-center gap-4 rounded-sm hover:bg-white/90 active:scale-95 transition-all uppercase tracking-[0.2em] focus:ring-8 focus:ring-white/20 focus:outline-none shadow-2xl ${isTV ? 'px-14 py-8 text-xl shadow-[0_0_40px_rgba(255,255,255,0.15)] mt-16 mb-10' : 'px-12 py-5 text-lg mt-10 mb-12'
                }`}
              >
                <Play className={`${isTV ? 'w-8 h-8' : 'w-5 h-5'} fill-current`} />
                {item.type === 'TV' ? 'Abrir Canal' : (item.type === 'Series' ? 'Ver Episódios' : 'Reproduzir')}
              </button>

              {item.type === 'Series' && lastProgress && (
                <button
                  onClick={() => {
                    if (onPlay) {
                      onPlay([{
                        url: xtreamService.getStreamUrl(lastProgress.streamId, 'series', 'mp4'),
                        title: `${item.name} - T${lastProgress.seasonId} E${lastProgress.episodeNum}`,
                        streamId: lastProgress.streamId,
                        contentType: 'EPISODE',
                        seriesId: String(item.id),
                        seasonId: lastProgress.seasonId,
                        episodeNum: lastProgress.episodeNum,
                        startAt: lastProgress.progressSecs || 0
                      }], 0);
                    }
                  }}
                  className={`w-fit bg-white/10 hover:bg-white/20 text-white border border-white/20 flex flex-col items-center justify-center gap-1 rounded-sm transition-all group active:scale-95 shadow-2xl ${isTV ? 'px-14 py-6 text-xl shadow-[0_0_40px_rgba(255,255,255,0.05)] mt-16 mb-10' : 'px-12 py-3 text-lg mt-10 mb-12'}`}
                >
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors">
                    <PlayCircle className="w-5 h-5 text-yellow-500" />
                    Continuar
                  </div>
                  <div className="text-sm border-t border-white/10 pt-1 mt-1 font-black uppercase tracking-tighter text-white/50">
                    S{lastProgress.seasonId} • E{lastProgress.episodeNum}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Seção de Elenco (Se disponível no TMDB) */}
          {cast.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#121212] pb-4">
                <Users className="w-5 h-5 text-white/20" />
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Elenco Principal</h2>
              </div>

              {/* Carrossel de Atores Horizontal - Estilo Disney+/Netflix */}
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2 mask-linear-right">
                {cast.map(actor => (
                  <div key={actor.id} className="group flex-shrink-0 flex flex-col items-center gap-3 w-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 overflow-hidden group-hover:border-white/40 border-dashed transition-all duration-300 shadow-lg">
                      {actor.profile_path ? (
                        <img
                          src={tmdbService.getImageUrl(actor.profile_path, 'w185')}
                          alt={actor.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-110 group-hover:scale-120"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-[10px] font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">
                        {actor.name}
                      </p>
                      <p className="text-[8px] text-white/20 truncate uppercase tracking-tighter line-clamp-1">
                        {actor.character}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Episódios para Séries */}
      {showEpisodesModal && (
        <DetailsSeriesPage 
          item={item} 
          onClose={() => setShowEpisodesModal(false)} 
          isTV={isTV}
          onPlay={onPlay}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}
