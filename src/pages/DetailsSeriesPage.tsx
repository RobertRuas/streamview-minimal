import { useState, useEffect } from 'react';
import { Play, ChevronDown, ChevronUp, X, Clock, Loader2, Star, PlayCircle } from 'lucide-react';
import { ContentItem } from '../types';
import { xtreamService } from '../services/xtream.service';
import { useAuthStore } from '../store/auth.store';
import { API_BASE_URL } from '../config/api';

interface DetailsSeriesPageProps {
  item: ContentItem;
  onClose: () => void;
  isTV?: boolean;
  onPlay?: (items: { url: string; title: string; streamId: string; contentType: 'TV' | 'MOVIE' | 'SERIES' | 'EPISODE'; seriesId?: string; seasonId?: string; episodeNum?: number; startAt?: number; }[], index: number) => void;
  refreshTrigger?: number;
}

/**
 * DetailsSeriesPage
 * Exibe as temporadas e episódios de uma série em acordeão simplificado.
 */
export function DetailsSeriesPage({ item, onClose, isTV = false, onPlay, refreshTrigger }: DetailsSeriesPageProps) {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      // Só mostra loading na primeira vez
      if (seasons.length === 0) setIsLoading(true);
      setErrorState(null);

      try {
        let parsedSeasons: any[] = [];

        // Se item.seasons já veio preenchido, usa como base
        if (item.seasons && item.seasons.length > 0) {
          parsedSeasons = item.seasons.map((s: any) => ({
            id: s.id || `sn-${s.season_number || s.number}`,
            number: s.season_number || s.number || 1,
            name: s.name || `Temporada ${s.season_number || s.number}`,
            episodes: s.episodes || []
          }));
        } else {
          // Busca da API Xtream
          const details = await xtreamService.getSeriesDetails(item.id);
          if (!details || (!details.episodes && !details.seasons)) {
            throw new Error('Nenhum dado retornado do provedor IPTV.');
          }

          if (details.episodes) {
            if (Array.isArray(details.episodes)) {
              const groups: { [key: string]: any[] } = {};
              details.episodes.forEach((e: any) => {
                const sNum = e.season || e.season_number || 1;
                if (!groups[sNum]) groups[sNum] = [];
                groups[sNum].push(e);
              });
              parsedSeasons = Object.entries(groups).map(([sNum, eps]) => ({
                id: `sn-${sNum}`,
                number: parseInt(sNum) || 1,
                name: `Temporada ${sNum}`,
                episodes: eps
              }));
            } else if (typeof details.episodes === 'object') {
              parsedSeasons = Object.entries(details.episodes).map(([sNum, eps]) => {
                const episodesArray = Array.isArray(eps) ? eps : [eps];
                const seasonObj = details.seasons?.find((s: any) => String(s.season_number) === sNum);
                return {
                  id: `sn-${sNum}`,
                  number: parseInt(sNum) || 1,
                  name: seasonObj?.name || `Temporada ${sNum}`,
                  episodes: episodesArray
                };
              });
            }
          }
        }

        // Buscar o progresso do usuário no Banco de Dados (SEMPRE roda)
        let dbProgress: any[] = [];
        try {
          const token = useAuthStore.getState().token;
          if (token) {
            const progressRes = await fetch(`${API_BASE_URL}/progress?seriesId=${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const progressData = await progressRes.json();
            if (progressData.success) dbProgress = progressData.data;
          }
        } catch (pErr) {
          console.warn('Erro ao buscar progresso (não crítico):', pErr);
        }

        // Mescla episódios com dados de progresso
        const finalSeasons = parsedSeasons.map(s => ({
          ...s,
          episodes: (s.episodes || []).map((e: any, idx: number) => {
            const streamId = String(e.id || e.id_stream || e.stream_id || `ep-${idx}`);
            const progRecord = dbProgress.find(p => p.streamId === streamId);
            const calculatedProgress = (progRecord && progRecord.durationSecs > 0)
              ? Math.floor((progRecord.progressSecs / progRecord.durationSecs) * 100)
              : Number(e.info?.progress || e.progress || 0);

            return {
              id: streamId,
              name: String(e.title || e.name || `Episódio ${e.episode_num || idx + 1}`),
              duration: String(e.info?.duration || e.duration || '00:00'),
              progress: calculatedProgress,
              streamUrl: String(e.url || e.direct_source || ''),
              startAt: progRecord ? progRecord.progressSecs : 0
            };
          })
        })).sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

        setSeasons(finalSeasons);
        if (finalSeasons.length > 0) {
          setExpandedSeasonId(finalSeasons[0].id);
        } else {
          setErrorState('Nenhum episódio localizado.');
        }

      } catch (error: any) {
        console.error('Erro ao buscar episódios:', error);
        setErrorState(error.message || 'Falha ao buscar episódios.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [item.id, item.seasons, refreshTrigger]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-16 bg-black/80 animate-in fade-in duration-500">
      <div className="relative w-full max-w-5xl max-h-[75vh] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-8 border-b border-white/10 relative bg-[#111111]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-24 rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block shrink-0">
              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black bg-white text-black px-2.5 py-1 rounded-md tracking-widest uppercase shadow-xl">Série</span>
                {item.rating && (
                  <span className="flex items-center gap-2 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/30">
                    <Star className="w-3.5 h-3.5 fill-current" /> {item.rating}
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none shrink-0">{item.name}</h2>
              <p className="text-xs text-white/40 uppercase tracking-[0.4em] font-bold">Temporadas e Episódios</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all transform hover:rotate-90 active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo Principal — Acordeão Simples */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
              <p className="text-xs text-white/40 uppercase tracking-widest">Carregando...</p>
            </div>
          ) : errorState ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <p className="text-sm text-white/60">{errorState}</p>
              <button onClick={() => window.location.reload()} className="text-xs text-white/40 border border-white/10 px-4 py-2 rounded hover:bg-white/5">
                Tentar Novamente
              </button>
            </div>
          ) : (
            seasons.map(season => {
              const isExpanded = expandedSeasonId === season.id;
              return (
                <div key={season.id} className="border border-white/10 rounded-lg overflow-hidden">
                  
                  {/* Cabeçalho da Temporada */}
                  <button 
                    onClick={() => setExpandedSeasonId(isExpanded ? null : season.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${isExpanded ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">T{season.number}</span>
                      <span className="text-sm text-white/40">{season.episodes.length} episódios</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Lista de Episódios */}
                  {isExpanded && (
                    <div className="divide-y divide-white/5">
                      {season.episodes.map((episode: any, idx: number) => (
                        <div 
                          key={episode.id}
                          onClick={() => {
                            if (onPlay) {
                              const playlist = season.episodes.map((ep: any, i: number) => ({
                                url: xtreamService.getStreamUrl(ep.id, 'series', 'mp4'),
                                title: `${item.name} - T${season.number} E${i + 1}`,
                                streamId: String(ep.id),
                                contentType: 'EPISODE' as const,
                                seriesId: String(item.id),
                                seasonId: String(season.number),
                                episodeNum: i + 1,
                                startAt: ep.startAt || 0
                              }));
                              onPlay(playlist, idx);
                            }
                          }}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          {/* Linha do episódio */}
                          <div className="px-5 py-3 flex items-center gap-4">
                            <span className="text-xs font-mono text-white/30 w-6 text-center shrink-0">{idx + 1}</span>
                            <p className="flex-1 text-sm text-white/80 truncate">{episode.name}</p>
                            <span className="text-xs text-white/30 shrink-0">{episode.duration}</span>
                            <Play className="w-3.5 h-3.5 text-white/20 shrink-0" />
                          </div>

                          {/* Barra de progresso verde */}
                          {episode.progress > 0 && (
                            <div className="h-[3px] bg-emerald-400" style={{ width: `${episode.progress}%` }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between">
          <span className="text-xs text-white/30 uppercase tracking-widest">{seasons.length} Temporadas</span>
          <span className="text-xs text-white/20">Sincronizado</span>
        </div>
      </div>
    </div>
  );
}
