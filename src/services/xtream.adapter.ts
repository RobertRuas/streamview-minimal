import { 
  XtreamChannel, 
  XtreamMoviesListing, 
  XtreamShowListing, 
  BaseContentItem
} from '../types/xtream.types';

/**
 * Adaptador para converter dados da API Xtream para o formato interno da aplicação.
 * Este adaptador garante que a interface do frontend não precise lidar com a estrutura
 * mutável da API IPTV.
 */
export class XtreamAdapter {
  
  /**
   * Trata URLs de imagem para usar o proxy local e evitar erros de CORS/ORB
   */
  private static formatImageUrl(url?: string): string {
    if (!url) return '';
    
    // Lista de domínios conhecidos que precisam de proxy (carregados do .env)
    const allowedDomains = (import.meta.env.VITE_ALLOWED_PROXY_DOMAINS || '').split(',');

    for (const domain of allowedDomains) {
      if (domain && url.includes(domain)) {
        // Remove o protocolo e o domínio para usar o proxy relativo
        return url.replace(/^https?:\/\/[^/]+/, '/image-proxy');
      }
    }

    return url;
  }
  
  /**
   * Converte um stream de TV ao vivo para o formato ContentItem
   */
  static toLiveStream(item: XtreamChannel, categoryName: string = 'TV Ao Vivo'): BaseContentItem {
    return {
      id: `tv-${item.stream_id}`,
      name: item.name,
      category: categoryName,
      type: 'TV',
      isFavorite: false,
      imageUrl: this.formatImageUrl(item.stream_icon) || import.meta.env.VITE_PLACEHOLDER_IMAGE,
      description: `Canal de TV: ${item.name}. Assista agora.`,
      streamUrl: item.url
    };
  }

  /**
   * Converte um filme (VOD) para o formato ContentItem
   */
  static toMovie(item: XtreamMoviesListing, categoryName: string = 'Filmes'): BaseContentItem {
    // Alguns servidores Xtream usam o campo 'title' em vez de 'name' em listagens gerais
    const resolvedName = item.name || item.title || 'Filme sem título';
    
    return {
      id: `mv-${item.stream_id}`,
      name: resolvedName,
      category: categoryName,
      type: 'Movie',
      isFavorite: false,
      imageUrl: this.formatImageUrl(item.stream_icon) || import.meta.env.VITE_PLACEHOLDER_IMAGE,
      description: item.plot || `Filme: ${resolvedName}. Assista agora.`,
      streamUrl: item.url,
      rating: item.rating,
      year: item.year || undefined,
      cast: item.cast || undefined,
      director: item.director || undefined,
      genre: item.genre || undefined
    };
  }

  /**
   * Converte uma série para o formato ContentItem
   */
  static toSeries(item: XtreamShowListing, categoryName: string = 'Séries'): BaseContentItem {
    return {
      id: `sr-${item.series_id}`,
      name: item.name,
      category: categoryName,
      type: 'Series',
      isFavorite: false,
      imageUrl: this.formatImageUrl(item.cover) || import.meta.env.VITE_PLACEHOLDER_IMAGE,
      description: item.plot || `Assista a série ${item.name}.`,
      rating: item.rating,
      cast: item.cast || undefined,
      director: item.director || undefined,
      genre: item.genre || undefined
    };
  }

  /**
   * Mapeia categorias para um formato simplificado
   */
  static mapCategories(categories: any[]): { id: string; name: string }[] {
    return categories.map(cat => ({
      id: cat.category_id,
      name: cat.category_name
    }));
  }
}
