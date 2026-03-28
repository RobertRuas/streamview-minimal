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
 * Exibe as temporadas e episódios de uma série com visual Premium e Sólido.
 */
export function DetailsSeriesPage({ item, onClose, isTV = false, onPlay, refreshTrigger }: DetailsSeriesPageProps) {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (item.seasons && item.seasons.length > 0) {
      setExpandedSeasonId(item.seasons[0].id);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setErrorState(null);
      try {
        const details = await xtreamService.getSeriesDetails(item.id);
        
        if (!details || (!details.episodes && !details.seasons)) {
          throw new Error('Nenhum dado retornado do provedor IPTV.');
        }

        let parsedSeasons: any[] = [];

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
          } 
          else if (typeof details.episodes === 'object') {
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

        // 3. Buscar o progresso do usuário no nosso Banco de Dados
        let dbProgress: any[] = [];
        try {
          const token = useAuthStore.getState().token;
          
          if (token) {
            const progressRes = await fetch(`${API_BASE_URL}/progress`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const progressData = await progressRes.json();
            if (progressData.success) dbProgress = progressData.data;
          }
        } catch (pErr) {
          console.warn('Erro ao buscar progresso (não crítico):', pErr);
        }

        const finalSeasons = parsedSeasons.map(s => ({
          ...s,
          episodes: s.episodes.map((e: any, idx: number) => {
            const streamId = String(e.id || e.id_stream || e.stream_id || `ep-${idx}`);
            // Encontra o registro de progresso para este episódio
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
          setErrorState('Nenhum episódio localizado na estrutura da API.');
        }

      } catch (error: any) {
        console.error('Erro ao buscar episódios:', error);
        setErrorState(error.message || 'Falha ao buscar episódios com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [item.id, item.seasons]);

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

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
                <Loader2 className="w-12 h-12 text-white animate-spin absolute inset-0 [animation-delay:-150ms]" />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.5em] font-bold animate-pulse">Sincronizando Episódios</p>
            </div>
          ) : errorState ? (
            <div className="flex flex-col items-center justify-center h-80 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <X className="w-8 h-8 text-red-500/50" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-white uppercase tracking-widest">Ops! Algo deu errado</p>
                <p className="text-xs text-white/30 max-w-xs mx-auto leading-relaxed">{errorState}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-[10px] font-bold text-white/40 border border-white/10 px-6 py-2 rounded-full hover:bg-white/5 transition-colors uppercase tracking-widest"
              >
                Tentar Novamente
              </button>
            </div>
          ) : seasons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4 text-white/10">
              <p className="text-sm uppercase tracking-widest font-black">Nenhuma temporada encontrada</p>
            </div>
          ) : (
            seasons.map(season => {
              const isExpanded = expandedSeasonId === season.id;
              
              return (
                <div 
                  key={season.id} 
                  className={`group transition-all duration-300 border rounded-2xl overflow-hidden ${
                    isExpanded 
                      ? 'bg-[#121212] border-white/10 shadow-2xl' 
                      : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Cabeçalho da Temporada */}
                  <button 
                    onClick={() => setExpandedSeasonId(isExpanded ? null : season.id)}
                    className={`w-full flex items-center justify-between px-8 py-6 transition-all relative ${
                      isExpanded ? 'bg-[#181818]' : 'hover:bg-[#181818]'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        isExpanded ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/20 text-white/60 group-hover:border-white/40'
                      }`}>
                        <span className="text-base font-black">{season.number}</span>
                      </div>
                      <div className="text-left flex flex-col gap-0.5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Temporada {season.number}</h3>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em]">{season.episodes.length} Episódios Disponíveis</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg transition-all duration-500 ${isExpanded ? 'bg-white/10 rotate-180 text-white shadow-xl' : 'text-white/40'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  {/* Grid de Episódios */}
                  {isExpanded && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-500 overflow-hidden">
                      <div className="flex flex-col gap-px bg-white/5 border-t border-white/5">
                        {season.episodes.map((episode, idx) => (
                          <div 
                            key={episode.id}
                            onClick={() => {
                              if (onPlay) {
                                // Cria a playlist com todos os episódios da temporada atual
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
                            className="group/ep bg-[#0c0c0c] p-6 flex items-center gap-6 hover:bg-[#151515] transition-all cursor-pointer relative"
                          >
                            {/* Número do Episódio */}
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/ep:bg-white group-hover/ep:text-black transition-all">
                              <span className="text-xs font-black font-mono">{String(idx + 1).padStart(2, '0')}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <h4 className="text-base font-bold text-white/80 truncate group-hover/ep:text-white transition-colors">{episode.name}</h4>
                                <div className="flex items-center gap-2 text-xs font-mono text-white/20 px-2 py-0.5 bg-white/5 rounded">
                                  <Clock className="w-3 h-3" />
                                  {episode.duration}
                                </div>
                              </div>
                              
                              {/* Barra de Progresso Refinada */}
                              <div className="space-y-1.5">
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-white/40 to-white/90 group-hover/ep:from-white group-hover/ep:to-white transition-all duration-1000" 
                                    style={{ width: `${episode.progress || 0}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover/ep:text-white/60">
                                  <span>Progresso</span>
                                  <span>{episode.progress || 0}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Botão Play Individual */}
                            <div className="shrink-0 scale-75 group-hover/ep:scale-100 opacity-0 group-hover/ep:opacity-100 transition-all duration-300">
                              <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/10">
                                <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="px-8 py-5 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/30">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-[#222] flex items-center justify-center shadow-lg">
                  <PlayCircle className="w-3.5 h-3.5 text-white/40" />
                </div>
              ))}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest leading-none mt-1">Sincronizado com Provedor</span>
          </div>
          <p className="text-xs text-white/20 uppercase tracking-[0.4em] font-medium hidden sm:block">{seasons.length} Temporadas Carregadas</p>
        </div>
      </div>
    </div>
  );
}
