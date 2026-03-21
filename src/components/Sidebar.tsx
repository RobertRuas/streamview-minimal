import { Search, Home, Tv, Film, Clapperboard, Settings, XCircle, LogOut, X } from 'lucide-react';
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
  isOpen?: boolean;
  onClose?: () => void;
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
  isOpen = false,
  onClose,
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
    <>
      {/* Overlay para fechar o menu no mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar (Fixo no PC / Drawer no Mobile) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen flex flex-col bg-[#0f0f0f] border-r border-[#121212] transition-transform duration-300 ease-in-out z-[110] md:z-20 md:translate-x-0 ${
          isCollapsed ? 'md:w-24' : 'md:w-72'
        } ${isOpen ? 'translate-x-0 w-[80%] max-w-[300px]' : '-translate-x-full'}`}
      >
        <div className={`p-6 flex flex-col h-full ${isCollapsed ? 'md:items-center' : ''}`}>
          {/* Logo e Nome da Marca */}
          <div className={`flex items-center justify-between transition-all ${isCollapsed ? 'mb-12' : 'mb-8'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                <div className="w-5 h-5 bg-black rotate-45" />
              </div>
              {(!isCollapsed || isOpen) && <span className="text-xl lg:text-lg font-black tracking-tighter uppercase whitespace-nowrap">Project Freedom</span>}
            </div>

            {/* BOTÃO FECHAR (Mobile Only) */}
            <button 
              onClick={onClose}
              className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
              title="Fechar Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Campo de Pesquisa Global (Oculto se colapsado, mas exibido no Drawer mobile) */}
          {(!isCollapsed || isOpen) && (
            <div className="relative mb-8 animate-in fade-in slide-in-from-left-2 duration-300">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-10 text-sm focus:outline-none focus:border-white/20 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && onClose?.()}
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
          <nav className={`space-y-4 ${isCollapsed ? 'md:w-full md:flex md:flex-col md:items-center' : ''}`}>
            <NavItem
              icon={<Home className={isCollapsed ? "md:w-6 md:h-6" : "w-4 h-4"} />}
              label={isCollapsed && !isOpen ? "" : "Inicio"}
              active={activePage === 'Inicio'}
              onClick={() => { onPageChange('Inicio'); onClose?.(); }}
              hideLabel={isCollapsed && !isOpen}
            />
            <NavItem
              icon={<Tv className={isCollapsed ? "md:w-6 md:h-6" : "w-4 h-4"} />}
              label={isCollapsed && !isOpen ? "" : "TV ao Vivo"}
              active={activePage === 'TV'}
              onClick={() => { onPageChange('TV'); onClose?.(); }}
              hideLabel={isCollapsed && !isOpen}
            />
            <NavItem
              icon={<Film className={isCollapsed ? "md:w-6 md:h-6" : "w-4 h-4"} />}
              label={isCollapsed && !isOpen ? "" : "Cine Filmes"}
              active={activePage === 'Filmes'}
              onClick={() => { onPageChange('Filmes'); onClose?.(); }}
              hideLabel={isCollapsed && !isOpen}
            />
            <NavItem
              icon={<Clapperboard className={isCollapsed ? "md:w-6 md:h-6" : "w-4 h-4"} />}
              label={isCollapsed && !isOpen ? "" : "Séries"}
              active={activePage === 'Series'}
              onClick={() => { onPageChange('Series'); onClose?.(); }}
              hideLabel={isCollapsed && !isOpen}
            />
          </nav>

          {/* Rodapé da Sidebar com Configurações */}
          <div className={`mt-auto pt-6 border-t border-[#121212] ${isCollapsed ? 'md:w-full md:flex md:justify-center md:pb-4' : ''}`}>
            <NavItem
              icon={<Settings className={isCollapsed ? "md:w-6 md:h-6" : "w-4 h-4"} />}
              label={isCollapsed && !isOpen ? "" : "Ajustes"}
              active={activePage === 'Configuracoes'}
              onClick={() => { onPageChange('Configuracoes'); onClose?.(); }}
              hideLabel={isCollapsed && !isOpen}
            />
            <NavItem
              icon={<LogOut className={isCollapsed ? "md:w-6 md:h-6 text-red-500/70" : "w-4 h-4 text-red-500/70"} />}
              label={isCollapsed && !isOpen ? "" : "Sair"}
              active={false}
              onClick={handleLogout}
              hideLabel={isCollapsed && !isOpen}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
