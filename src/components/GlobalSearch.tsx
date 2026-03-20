import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { ContentItem, ViewMode } from '../types';
import { ContentList } from './ContentList';

interface GlobalSearchProps {
  channels: ContentItem[];
  movies: ContentItem[];
  series: ContentItem[];
  searchQuery: string;
  viewMode: ViewMode;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onItemClick: (item: ContentItem) => void;
  onSeeMore: (page: any) => void;
  isTV?: boolean;
}

/**
 * Componente GlobalSearch
 * Exibe resultados de busca divididos em seções: TV, Filmes e Séries.
 */
export function GlobalSearch({
  channels,
  movies,
  series,
  searchQuery,
  viewMode,
  favorites,
  onToggleFavorite,
  onItemClick,
  onSeeMore,
  isTV
}: GlobalSearchProps) {
  
  // Filtra os resultados para cada seção de forma otimizada com normalização
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || query.length < 1) return { channels: [], movies: [], series: [], total: 0 };

    // Filtros rápidos
    const filteredChannels = channels.filter(item => 
      (item.name?.toLowerCase() || '').includes(query) || 
      (item.category?.toLowerCase() || '').includes(query)
    );
    
    const filteredMovies = movies.filter(item => 
      (item.name?.toLowerCase() || '').includes(query) || 
      (item.category?.toLowerCase() || '').includes(query)
    );
    
    const filteredSeries = series.filter(item => 
      (item.name?.toLowerCase() || '').includes(query) || 
      (item.category?.toLowerCase() || '').includes(query)
    );

    return {
      channels: filteredChannels.slice(0, 100), // Limite de 100 por seção por performance
      movies: filteredMovies.slice(0, 100),
      series: filteredSeries.slice(0, 100),
      total: filteredChannels.length + filteredMovies.length + filteredSeries.length
    };
  }, [searchQuery, channels, movies, series]);

  // Define as seções que possuem conteúdo
  const sections = useMemo(() => [
    { title: 'Canais de TV', items: filteredResults.channels, type: 'TV' as const, page: 'TV' as const },
    { title: 'Filmes', items: filteredResults.movies, type: 'Movie' as const, page: 'Filmes' as const },
    { title: 'Séries', items: filteredResults.series, type: 'Series' as const, page: 'Series' as const }
  ].filter(s => s.items.length > 0), [filteredResults]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Cabeçalho da Busca */}
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Resultados para "{searchQuery}"
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Encontramos {filteredResults.total} {filteredResults.total === 1 ? 'item' : 'itens'} no total
          </p>
        </div>
      </div>

      {sections.length > 0 ? (
        sections.map((section, idx) => (
          <section key={idx} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg lg:text-base font-medium text-white/90">{section.title}</h3>
                <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-white/40 font-bold">
                  {section.items.length}
                </span>
              </div>
              <button 
                className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors group"
                onClick={() => onSeeMore(section.page)}
              >
                Ver tudo na página <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            <ContentList 
              items={section.items} 
              viewMode={viewMode} 
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onItemClick={onItemClick}
              isTV={isTV}
            />
          </section>
        ))
      ) : (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-sm">
          <p className="text-white/20 text-lg">Nenhum resultado encontrado para sua pesquisa.</p>
          <p className="text-white/10 text-sm mt-2">Tente outros termos ou verifique a ortografia.</p>
        </div>
      )}
    </div>
  );
}
