import { tmdbConfig } from '../config/tmdb.config';

/**
 * Interface para os resultados da busca no TMDB
 */
export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
}

/**
 * Serviço responsável por buscar metadados e imagens do TMDB.
 */
export class TMDBService {
  /**
   * Busca detalhes completos de um item pelo ID do TMDB, incluindo créditos
   */
  async getFullDetails(tmdbId: number, isSeries: boolean = false): Promise<TMDBMovie | null> {
    const token = tmdbConfig.accessToken;
    if (!token) return null;

    try {
      const endpoint = isSeries ? '/tv' : '/movie';
      const url = `${tmdbConfig.apiBaseUrl}${endpoint}/${tmdbId}?language=pt-BR&append_to_response=credits`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar detalhes completos no TMDB:', error);
      return null;
    }
  }

  /**
   * Busca um filme ou série pelo nome no TMDB
   * @param query Nome do conteúdo (filme ou série)
   * @param isSeries Define se a busca deve focar em séries (TV)
   */
  async searchContent(query: string, isSeries: boolean = false): Promise<TMDBMovie | null> {
    const token = tmdbConfig.accessToken;
    
    // Limpeza básica do título para melhorar a busca no TMDB
    let cleanQuery = query
      .replace(/\[.*?\]/g, '') // Remove [4K], [Dual], etc.
      .replace(/\(.*?\)|\b\d{4}\b/g, '') // Remove (1999) ou o ano isolado
      .replace(/\s\s+/g, ' ') // Remove espaços duplicados
      .trim();

    if (!token) {
      console.warn('TMDB: Access Token não configurado no .env ou tmdbConfig.');
      return null;
    }

    try {
      const endpoint = isSeries ? '/search/tv' : '/search/movie';
      const url = `${tmdbConfig.apiBaseUrl}${endpoint}?query=${encodeURIComponent(cleanQuery || query)}&language=pt-BR&page=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API do TMDB: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar conteúdo no TMDB:', error);
      return null;
    }
  }

  /**
   * Gera a URL completa para uma imagem do TMDB
   * @param path Caminho da imagem (ex: poster_path ou backdrop_path)
   * @param size Tamanho desejado (default do config)
   */
  getImageUrl(path: string | null, size: string = tmdbConfig.posterSize): string | null {
    if (!path) return null;
    return `${tmdbConfig.imageBaseUrl}/${size}${path}`;
  }
}

// Exporta uma instância única do serviço
export const tmdbService = new TMDBService();
