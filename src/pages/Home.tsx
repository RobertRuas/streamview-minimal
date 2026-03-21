import { useMemo } from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { ContentItem, ViewMode } from '../types';
import { ContentList } from '../components/ContentList';

interface HomeProps {
  channels: ContentItem[];
  movies: ContentItem[];
  series: ContentItem[];
  viewMode: ViewMode;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string, type?: 'TV' | 'MOVIE' | 'SERIES') => void;
  onItemClick: (item: ContentItem) => void;
  onSeeMore: (page: any) => void;
  isLoading?: boolean;
  isTV?: boolean;
}

/**
 * Página Inicial (Home)
 * Exibe um resumo dos conteúdos favoritados pelo usuário.
 */
export function Home({
  channels,
  movies,
  series,
  viewMode,
  searchQuery,
  favorites,
  onToggleFavorite,
  onItemClick,
  onSeeMore,
  isLoading,
  isTV
}: HomeProps) {

  // Filtra apenas os itens favoritos para cada categoria
  const favChannels = useMemo(() => channels.filter(c => favorites.includes(String(c.id))), [channels, favorites]);
  const favMovies = useMemo(() => movies.filter(m => favorites.includes(String(m.id))), [movies, favorites]);
  const favSeries = useMemo(() => series.filter(s => favorites.includes(String(s.id))), [series, favorites]);

  // Organiza as seções
  const homeSections = useMemo(() => {
    return [
      { 
        title: 'Canais Favoritos', 
        items: favChannels.slice(0, 6), 
        totalCount: favChannels.length,
        type: 'TV' as const, 
        page: 'TV' as const 
      },
      { 
        title: 'Filmes Favoritos', 
        items: favMovies.slice(0, 6), 
        totalCount: favMovies.length,
        type: 'Movie' as const, 
        page: 'Filmes' as const 
      },
      { 
        title: 'Séries Favoritas', 
        items: favSeries.slice(0, 6), 
        totalCount: favSeries.length,
        type: 'Series' as const, 
        page: 'Series' as const 
      }
    ];
  }, [favChannels, favMovies, favSeries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {homeSections.map((section, idx) => {
        if (section.items.length === 0) return null;
        
        return (
          <section key={idx}>
            {/* Cabeçalho da Seção */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg lg:text-base font-medium text-white/90">{section.title}</h2>
                <span className="bg-white/10 text-white/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{section.totalCount} salvos</span>
                {/* Nota: O filtro acima é local, mas section.items já é filtrado por favoritos. Porém o total de favoritos do tipo pode ser maior que 6. */}
                {/* Vou usar o count real da lista filtrada completa. */}
              </div>
              <button
                className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors group"
                onClick={() => onSeeMore({ type: section.page, onlyFavorites: true })}
              >
                Ver todos os favoritos <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Lista de Conteúdo da Seção */}
            <ContentList
              items={section.items}
              viewMode={viewMode}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onItemClick={onItemClick}
              isTV={isTV}
            />
          </section>
        );
      })}
      
      {homeSections.every(s => s.items.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Users className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Seu Dashboard está vazio</h2>
            <p className="text-white/40 max-w-xs mx-auto text-sm">Adicione canais, filmes ou séries aos seus favoritos para vê-los aqui na página inicial.</p>
          </div>
        </div>
      )}
    </div>
  );
}
