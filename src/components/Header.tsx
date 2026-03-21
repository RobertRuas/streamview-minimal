import { LayoutList, LayoutGrid, Menu } from 'lucide-react';
import { Page, ViewMode } from '../types';

interface HeaderProps {
  activePage: Page;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onMenuClick?: () => void;
}

/**
 * Componente Header (Fixo para PC / Adaptável para Mobile)
 * Exibe o título da página atual e controles para alternar entre visualização de Lista e Grade.
 * Adicionado suporte ao botão de menu hamburguer para telas mobile.
 */
export function Header({ activePage, viewMode, setViewMode, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#0f0f0f] border-b border-[#121212] px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
      {/* Lado Esquerdo: Título e Botão de Menu (Mobile) */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-white/70 hover:text-white transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl md:text-2xl lg:text-xl font-bold tracking-tight">{activePage}</h1>
      </div>
      
      {/* Lado Direito: Controles de Visualização (Lista/Grade) - Oculto em Detalhes */}
      {activePage !== 'Detalhes' && (
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-sm border border-white/10">
          <button 
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
            className={`p-1.5 rounded-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            title="Visualização em Grade"
            className={`p-1.5 rounded-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
