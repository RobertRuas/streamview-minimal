import { Star } from 'lucide-react';
import { ContentItem, ViewMode } from '../types';
import { TypeIcon } from './TypeIcon';
import { ContentPoster } from './ContentPoster';

interface ContentListProps {
  items: ContentItem[];
  viewMode: ViewMode;
  favorites: string[];
  onToggleFavorite: (id: string, type?: 'TV' | 'MOVIE' | 'SERIES') => void;
  onItemClick?: (item: ContentItem) => void;
  isTV?: boolean;
}

/**
 * Componente ContentList
 * Renderiza uma coleção de itens de conteúdo (TV, Filmes ou Séries).
 * Suporta dois modos de visualização: 'list' (lista compacta) e 'grid' (grade de cards).
 */
export function ContentList({ 
  items, 
  viewMode, 
  favorites,
  onToggleFavorite,
  onItemClick,
  isTV
}: ContentListProps) {
  // Caso não existam itens para exibir (ex: busca sem resultados)
  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-white/20 border border-dashed border-white/5 rounded-sm">
        Nenhum conteúdo encontrado
      </div>
    );
  }

  // Renderização em modo GRADE (Grid) com Fallback Flexbox para WebOS antigo
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-wrap -mx-0.5">
        {items.map(item => (
          <div key={item.id} className={`${isTV ? 'w-1/6' : 'w-1/2 sm:w-1/3 lg:w-1/6'} px-0.5 mb-1`}>
            <button 
              onClick={() => onItemClick?.(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onItemClick?.(item);
              }}
              className="w-full h-full group relative bg-[#0f0f0f] border border-[#121212] p-0 rounded-sm text-left outline-none focus:ring-2 focus:ring-white focus:border-transparent focus:scale-[1.03] hover:border-white/10 transition-all cursor-pointer flex flex-col overflow-hidden"
            >
              {/* Thumbnail Inteligente integrada ao TMDB */}
              <ContentPoster 
                name={item.name} 
                type={item.type} 
                fallbackUrl={item.imageUrl} 
                className="w-full"
                imageClassName="group-hover:scale-110 group-focus:scale-110"
                aspect="video"
              >
              </ContentPoster>

              {/* Barra de Progresso Discreta (Série/Filme) */}
              {item.progress !== undefined && item.progress > 0 && (
                <div className="w-full h-[3px] bg-white/5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.type === 'Series' ? 'bg-yellow-500/50' : 'bg-white/40'}`}
                    style={{ width: `${item.progress}%` }} 
                  />
                </div>
              )}
              
              {/* Informações do Item */}
              <div className="flex items-start justify-between gap-3 flex-1 p-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base lg:text-sm font-bold text-white/90 truncate group-hover:text-white group-focus:text-white transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs lg:text-[10px] text-white/40 mt-1 uppercase tracking-tight">{item.category}</p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const typeMap: Record<string, 'TV' | 'MOVIE' | 'SERIES'> = {
                      'Movie': 'MOVIE',
                      'Series': 'SERIES',
                      'TV': 'TV'
                    };
                    onToggleFavorite(item.id, typeMap[item.type] || 'MOVIE');
                  }}
                  className={`transition-all p-2 rounded-full hover:bg-white/10 ml-auto flex-shrink-0 ${favorites.includes(item.id) ? 'text-yellow-500 opacity-100' : 'text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/50'}`}
                  title={favorites.includes(item.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-current scale-110' : ''}`} />
                </button>
              </div>
            </button>
          </div>
        ))}
      </div>
    );
  }


  // Renderização em modo LISTA (List) - Agora com Fallback Flexbox
  return (
    <div className="flex flex-wrap gap-px bg-[#121212] border border-[#121212] rounded-sm overflow-hidden">
      {items.map(item => (
        <div key={item.id} className={`${isTV ? 'w-[calc(50%-0.5px)]' : 'w-full md:w-[calc(50%-0.5px)]'} bg-[#0f0f0f]`}>
          <button 
            onClick={() => onItemClick?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onItemClick?.(item);
            }}
            className="w-full h-full flex items-center gap-4 px-4 py-5 sm:py-4 hover:bg-white/5 outline-none focus:bg-white/10 focus:ring-inset focus:ring-1 focus:ring-white/50 transition-colors group cursor-pointer text-left border-b border-[#121212]"
          >
            {/* Ícone Lateral / Thumbnail Pequena */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#121212]">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = import.meta.env.VITE_PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <TypeIcon type={item.type} className="w-6 h-6 text-white/20" />
              )}
            </div>
            
            {/* Título, Categoria e Detalhes */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base lg:text-base font-bold text-white/90 truncate group-hover:text-white group-focus:text-white transition-colors">
                {item.name}
              </h3>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-[10px] sm:text-xs lg:text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {item.category}
                </p>
                {item.description && (
                  <p className="text-[10px] sm:text-sm lg:text-xs text-white/25 truncate font-light max-w-2xl line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Ações e Metadados */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const typeMap: Record<string, 'TV' | 'MOVIE' | 'SERIES'> = {
                    'Movie': 'MOVIE',
                    'Series': 'SERIES',
                    'TV': 'TV'
                  };
                  onToggleFavorite(item.id, typeMap[item.type] || 'MOVIE');
                }}
                className={`transition-all p-3 rounded-full hover:bg-white/10 ${favorites.includes(item.id) ? 'text-yellow-500' : 'text-white/5 opacity-0 group-hover:opacity-100 hover:text-white/40'}`}
                title={favorites.includes(item.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Star className={`w-6 h-6 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
