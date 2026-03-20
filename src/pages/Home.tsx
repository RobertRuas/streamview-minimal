import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { ContentItem, ViewMode } from '../types';
import { ContentList } from '../components/ContentList';

interface HomeProps {
  channels: ContentItem[];
  movies: ContentItem[];
  series: ContentItem[];
  viewMode: ViewMode;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onItemClick: (item: ContentItem) => void;
  onSeeMore: (page: any) => void;
  isLoading?: boolean;
  isTV?: boolean;
}

/**
 * Página Inicial (Home)
 * Exibe um resumo dos conteúdos da API real filtrados ou favoritos.
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

  // Lógica para busca global removida (agora centralizada no App.tsx via GlobalSearch)

  // Organiza as seções com 10 itens cada (conforme solicitado)
  const homeSections = useMemo(() => {
    return [
      { title: 'Canais de TV', items: channels.slice(0, 6), type: 'TV' as const, page: 'TV' as const },
      { title: 'Filmes | Lançamentos', items: movies.slice(0, 6), type: 'Movie' as const, page: 'Filmes' as const },
      { title: 'Séries em Destaque', items: series.slice(0, 6), type: 'Series' as const, page: 'Series' as const }
    ];
  }, [channels, movies, series]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20"></div>
      </div>
    );
  }

  // Blocos de busca removidos (agora centralizados no App.tsx via GlobalSearch)

  // Caso contrário, exibe as seções principais
  return (
    <div className="space-y-12">
      {homeSections.map((section, idx) => (
        <section key={idx}>
          {/* Cabeçalho da Seção */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg lg:text-base font-medium text-white/90">{section.title}</h2>
            <button
              className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors group"
              onClick={() => onSeeMore(section.page)}
            >
              Ver mais <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
      ))}
    </div>
  );
}
