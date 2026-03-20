/**
 * Tipos do domínio principal da aplicação.
 * Contratos centrais usados pela UI, páginas e componentes.
 */

export type ContentType = 'TV' | 'Movie' | 'Series';

export interface Episode {
  id: string;
  name: string;
  duration: string;
  progress?: number; // 0-100
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface ContentItem {
  id: string;
  name: string;
  category: string;
  type: ContentType;
  isFavorite: boolean;
  thumbnail?: string;
  imageUrl?: string;
  description?: string;
  progress?: number; // Para filmes (0-100)
  seasons?: Season[]; // Para séries
  rating?: string | number;
  year?: string | number;
  duration?: string;
  cast?: string;
  director?: string;
  genre?: string;
}

export type ViewMode = 'list' | 'grid';
export type Page = 'Inicio' | 'TV' | 'Filmes' | 'Series' | 'Configuracoes' | 'Detalhes';
