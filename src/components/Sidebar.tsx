import { Search, Home, Tv, Film, Clapperboard, Settings, XCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { Page } from '../types';
import { NavItem } from './NavItem';

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed?: boolean;
  showOnlyFavorites?: boolean;
  onToggleFavorites?: () => void;
}

/**
 * Componente Sidebar (Fixo para PC)
 * Responsável pela navegação principal e campo de busca.
 * Agora com suporte a modo colapsado para maximizar espaço no conteúdo.
 */
export function Sidebar({
  activePage,
  onPageChange,
  searchQuery,
  onSearchChange,
  isCollapsed = false,
  showOnlyFavorites = false,
  onToggleFavorites,
}: SidebarProps) {
  const { logout } = useAuthStore();
  
  const handleLogout = async () => {
    try {
      const fp = await fpPromise.load();
      const result = await fp.get();
      await logout(result.visitorId);
    } catch (err) {
      await logout(); // Fallback se o FP falhar
    }
  };
  
  return (
    <aside
      className={`relative h-screen hidden md:flex flex-col bg-[#0f0f0f] border-r border-[#121212] transition-all duration-500 ease-in-out z-20 ${isCollapsed ? 'w-24' : 'w-72'
        }`}
    >
      <div className={`p-6 flex flex-col h-full ${isCollapsed ? 'items-center' : ''}`}>
        {/* Logo e Nome da Marca */}
        <div className={`flex items-center justify-between transition-all ${isCollapsed ? 'mb-12' : 'mb-8'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center flex-shrink-0 shadow-lg">
              <div className="w-5 h-5 bg-black rotate-45" />
            </div>
            {!isCollapsed && <span className="text-xl lg:text-lg font-black tracking-tighter uppercase whitespace-nowrap">Project Freedom</span>}
          </div>
        </div>

        {/* Campo de Pesquisa Global (Oculto se colapsado) */}
        {!isCollapsed && (
          <div className="relative mb-8 animate-in fade-in slide-in-from-left-2 duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-10 text-sm focus:outline-none focus:border-white/20 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors p-1 rounded-full hover:bg-white/10"
                title="Limpar pesquisa"
              >
                <XCircle className="w-5 h-5 lg:w-4 lg:h-4" />
              </button>
            )}
          </div>
        )}

        {/* Links de Navegação Principal */}
        <nav className={`space-y-4 ${isCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
          <NavItem
            icon={<Home className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            label={isCollapsed ? "" : "Inicio"}
            active={activePage === 'Inicio'}
            onClick={() => onPageChange('Inicio')}
            hideLabel={isCollapsed}
          />
          <NavItem
            icon={<Tv className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            label={isCollapsed ? "" : "TV ao Vivo"}
            active={activePage === 'TV'}
            onClick={() => onPageChange('TV')}
            hideLabel={isCollapsed}
          />
          <NavItem
            icon={<Film className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            label={isCollapsed ? "" : "Cine Filmes"}
            active={activePage === 'Filmes'}
            onClick={() => onPageChange('Filmes')}
            hideLabel={isCollapsed}
          />
          <NavItem
            icon={<Clapperboard className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            label={isCollapsed ? "" : "Séries"}
            active={activePage === 'Series'}
            onClick={() => onPageChange('Series')}
            hideLabel={isCollapsed}
          />
        </nav>

        {/* Rodapé da Sidebar com Configurações */}
        <div className={`mt-auto pt-6 border-t border-[#121212] ${isCollapsed ? 'w-full flex justify-center pb-4' : ''}`}>
          <NavItem
            icon={<Settings className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            label={isCollapsed ? "" : "Ajustes"}
            active={activePage === 'Configuracoes'}
            onClick={() => onPageChange('Configuracoes')}
            hideLabel={isCollapsed}
          />
          <NavItem
            icon={<LogOut className={isCollapsed ? "w-6 h-6 text-red-500/70" : "w-4 h-4 text-red-500/70"} />}
            label={isCollapsed ? "" : "Sair"}
            active={false}
            onClick={handleLogout}
            hideLabel={isCollapsed}
          />
        </div>
      </div>
    </aside>
  );
}
