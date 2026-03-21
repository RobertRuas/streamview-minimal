import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ContentItem, ViewMode, ContentType } from '../types';
import { ContentList } from '../components/ContentList';

interface ContentPageProps {
  items: ContentItem[];
  type: ContentType;
  categories: {id: string, name: string}[];
  onCategoryChange: (categoryId: string) => void;
  viewMode: ViewMode;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onItemClick: (item: ContentItem) => void;
  isLoading?: boolean;
  // Props para persistência de estado (ao voltar dos detalhes)
  initialCategoryId?: string;
  initialPage?: number;
  initialCatPage?: number;
  onStateChange?: (state: Partial<{categoryId: string, page: number, catPage: number}>) => void;
  isTV?: boolean;
  showOnlyFavorites?: boolean;
  onBack?: () => void;
}

const ITEMS_PER_PAGE = 20;
const CATEGORIES_PER_PAGE = 12;

/**
 * Componente ContentPage (Genérico)
 * Agora com seletor de categorias e paginação.
 */
export function ContentPage({ 
  items,
  type, 
  categories,
  onCategoryChange,
  viewMode, 
  searchQuery, 
  favorites, 
  onToggleFavorite,
  onItemClick,
  isLoading,
  initialCategoryId = 'all',
  initialPage = 1,
  initialCatPage = 1,
  onStateChange,
  isTV,
  showOnlyFavorites = false,
  onBack
}: ContentPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentCatPage, setCurrentCatPage] = useState(initialCatPage);

  // Notifica o componente pai sobre mudanças de estado para persistência
  useEffect(() => {
    onStateChange?.({ 
      categoryId: selectedCategoryId, 
      page: currentPage, 
      catPage: currentCatPage 
    });
  }, [selectedCategoryId, currentPage, currentCatPage, onStateChange]);
  
  // Reseta a página ao mudar a categoria ou fazer uma busca
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery]);

  // Filtra os dados com base na busca e se deve mostrar apenas favoritos
  const filteredData = useMemo(() => {
    let data = items;
    
    // Filtra por favoritos se o modo estiver ativado
    if (showOnlyFavorites) {
      data = data.filter(item => favorites.includes(String(item.id)));
    }
    
    if (searchQuery) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return data;
  }, [items, searchQuery, showOnlyFavorites, favorites]);

  // Paginação das categorias
  const totalCatPages = Math.ceil(categories.length / CATEGORIES_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentCatPage - 1) * CATEGORIES_PER_PAGE;
    return categories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [categories, currentCatPage]);

  // Paginação local dos dados carregados
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    onCategoryChange(id);
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20"></div>
        <p className="text-white/40 text-sm animate-pulse">Carregando conteúdos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicador de Filtro de Favoritos */}
      {showOnlyFavorites && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded transition-all text-sm font-medium border border-white/5 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight">Modo Favoritos Ativo</h3>
                <p className="text-blue-400 text-xs">Exibindo apenas seus itens salvos ({filteredData.length} encontrados)</p>
              </div>
            </div>
          </div>
          <p className="text-white/20 text-[10px] uppercase font-black tracking-widest hidden sm:block">Filtro Ativado</p>
        </div>
      )}

      {/* Seletor de Categorias */}
      {!showOnlyFavorites && (
        <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-white/60 ${isTV ? 'text-lg' : 'text-sm'}`}>
            <Filter className={isTV ? 'w-5 h-5' : 'w-4 h-4'} />
            <span>Categorias</span>
          </div>
          
          {/* Controles de Paginação de Categorias */}
          {totalCatPages > 1 && (
            <div className={`flex items-center ${isTV ? 'gap-6' : 'gap-3'}`}>
              <button
                disabled={currentCatPage === 1}
                onClick={() => setCurrentCatPage(p => p - 1)}
                className={`rounded-md bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-10 transition-colors ${isTV ? 'p-3' : 'p-1'}`}
              >
                <ChevronLeft className={isTV ? 'w-6 h-6' : 'w-4 h-4'} />
              </button>
              <span className={`text-white/20 uppercase tracking-widest font-bold ${isTV ? 'text-sm' : 'text-[10px]'}`}>
                Pág {currentCatPage} de {totalCatPages}
              </span>
              <button
                disabled={currentCatPage === totalCatPages}
                onClick={() => setCurrentCatPage(p => p + 1)}
                className={`rounded-md bg-white/5 text-white/40 hover:bg-white/10 disabled:opacity-10 transition-colors ${isTV ? 'p-3' : 'p-1'}`}
              >
                <ChevronRight className={isTV ? 'w-6 h-6' : 'w-4 h-4'} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Categoria "Todas" fixa sempre visível */}
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-6 py-3 rounded-sm text-xs sm:text-sm lg:text-xs transition-all whitespace-nowrap outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:scale-110 ${
              selectedCategoryId === 'all' 
                ? 'bg-white text-black font-black shadow-lg scale-105' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            } ${isTV ? 'px-10 py-5 text-xl' : ''}`}
          >
            Todas
          </button>

          {paginatedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-6 py-3 rounded-sm text-xs sm:text-sm lg:text-xs transition-all whitespace-nowrap outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:scale-110 ${
                selectedCategoryId === cat.id 
                  ? 'bg-white text-black font-black shadow-lg scale-105' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              } ${isTV ? 'px-10 py-5 text-xl' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Lista de Conteúdo com Loading Overlay */}
      <div className="relative min-h-[200px] pt-4">
        {isLoading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/40"></div>
          </div>
        )}
        
        {paginatedItems.length > 0 ? (
          <ContentList 
            items={paginatedItems} 
            viewMode={viewMode} 
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onItemClick={onItemClick}
            isTV={isTV}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <p>Nenhum conteúdo encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-8 pt-12 pb-20">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage(p => p - 1)}
            className={`p-4 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all focus:ring-4 focus:ring-white/20 ${isTV ? 'scale-125 mx-4' : ''}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className={`font-black text-white ${isTV ? 'text-2xl' : 'text-lg lg:text-base'}`}>{currentPage}</span>
            <span className={`text-white/20 ${isTV ? 'text-lg' : 'text-xs'}`}>de</span>
            <span className={`font-bold text-white/40 ${isTV ? 'text-xl' : 'text-base lg:text-sm'}`}>{totalPages}</span>
          </div>

          <button
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage(p => p + 1)}
            className={`p-4 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all focus:ring-4 focus:ring-white/20 ${isTV ? 'scale-125 mx-4' : ''}`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
