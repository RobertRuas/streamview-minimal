import { Home, Tv, Film, Clapperboard, Settings } from 'lucide-react';
import { Page } from '../types';

interface MobileNavProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

/**
 * Componente de Navegação Móvel (Tab Bar)
 * Substitui a Sidebar em dispositivos móveis.
 */
export function MobileNav({ activePage, onPageChange }: MobileNavProps) {
  const items = [
    { id: 'Inicio', icon: Home, label: 'Início' },
    { id: 'TV', icon: Tv, label: 'TV' },
    { id: 'Filmes', icon: Film, label: 'Filmes' }, // Ajustando para o label correto
    { id: 'Series', icon: Clapperboard, label: 'Séries' },
    { id: 'Configuracoes', icon: Settings, label: 'Mais' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-[50] px-2 pb-safe">
      <button
        onClick={() => onPageChange('Inicio')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
          activePage === 'Inicio' ? 'text-white' : 'text-white/40'
        }`}
      >
        <Home className={`w-5 h-5 ${activePage === 'Inicio' ? 'text-white' : ''}`} />
        <span className="text-[10px] uppercase font-bold">Início</span>
      </button>

      <button
        onClick={() => onPageChange('TV')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
          activePage === 'TV' ? 'text-white' : 'text-white/40'
        }`}
      >
        <Tv className={`w-5 h-5 ${activePage === 'TV' ? 'text-white' : ''}`} />
        <span className="text-[10px] uppercase font-bold">TV</span>
      </button>

      <button
        onClick={() => onPageChange('Filmes')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
          activePage === 'Filmes' ? 'text-white' : 'text-white/40'
        }`}
      >
        <Film className={`w-5 h-5 ${activePage === 'Filmes' ? 'text-white' : ''}`} />
        <span className="text-[10px] uppercase font-bold">Filmes</span>
      </button>

      <button
        onClick={() => onPageChange('Series')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
          activePage === 'Series' ? 'text-white' : 'text-white/40'
        }`}
      >
        <Clapperboard className={`w-5 h-5 ${activePage === 'Series' ? 'text-white' : ''}`} />
        <span className="text-[10px] uppercase font-bold">Séries</span>
      </button>

      <button
        onClick={() => onPageChange('Configuracoes')}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
          activePage === 'Configuracoes' ? 'text-white' : 'text-white/40'
        }`}
      >
        <Settings className={`w-5 h-5 ${activePage === 'Configuracoes' ? 'text-white' : ''}`} />
        <span className="text-[10px] uppercase font-bold">Mais</span>
      </button>
    </nav>
  );
}
