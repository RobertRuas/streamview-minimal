import { Xtream } from '@iptv/xtream-api';
import { xtreamConfig } from '../config/xtream.config';
import { XtreamAdapter } from './xtream.adapter';
import { 
  AppContentItem, 
  XtreamCategory, 
  XtreamEPG 
} from '../types/xtream.types';

/**
 * Serviço principal para interação com a API Xtream.
 * Utiliza o pacote @iptv/xtream-api para comunicação.
 */
export class XtreamService {
  private client: any;

  constructor() {
    this.client = new Xtream({
      url: xtreamConfig.host,
      username: xtreamConfig.username,
      password: xtreamConfig.password,
    });
  }

  /**
   * Obtém todas as categorias de TV ao vivo
   */
  async getLiveCategories(): Promise<XtreamCategory[]> {
    try {
      return await this.client.getChannelCategories();
    } catch (error) {
      console.error('Erro ao buscar categorias ao vivo:', error);
      return [];
    }
  }

  /**
   * Obtém canais de TV ao vivo, opcionalmente filtrados por categoria
   */
  async getLiveStreams(categoryId?: string, limit: number = 50): Promise<AppContentItem[]> {
    try {
      // Para garantir que "Todos" funcione em diferentes servidores, tentamos sem categoryId ou com '0'
      const id = categoryId === 'all' || !categoryId ? undefined : categoryId;
      const streams = await this.client.getChannels({ categoryId: id, limit });
      return streams.map((s: any) => XtreamAdapter.toLiveStream(s));
    } catch (error) {
      console.error('Erro ao buscar canais ao vivo:', error);
      return [];
    }
  }

  /**
   * Obtém categorias de filmes (VOD)
   */
  async getVODCategories(): Promise<XtreamCategory[]> {
    try {
      return await this.client.getMovieCategories();
    } catch (error) {
      console.error('Erro ao buscar categorias VOD:', error);
      return [];
    }
  }

  /**
   * Obtém filmes (VOD), opcionalmente filtrados por categoria
   */
  async getVODStreams(categoryId?: string, limit: number = 50): Promise<AppContentItem[]> {
    try {
      const movies = await this.client.getMovies({ categoryId, limit });
      return movies.map((m: any) => XtreamAdapter.toMovie(m));
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      return [];
    }
  }

  /**
   * Obtém categorias de séries
   */
  async getSeriesCategories(): Promise<XtreamCategory[]> {
    try {
      return await this.client.getShowCategories();
    } catch (error) {
      console.error('Erro ao buscar categorias de séries:', error);
      return [];
    }
  }

  /**
   * Obtém séries, opcionalmente filtradas por categoria
   */
  async getSeries(categoryId?: string, limit: number = 50): Promise<AppContentItem[]> {
    try {
      const series = await this.client.getShows({ categoryId, limit });
      return series.map((s: any) => XtreamAdapter.toSeries(s));
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      return [];
    }
  }

  /**
   * Obtém informações detalhadas de uma série, incluindo temporadas e episódios
   */
  async getSeriesDetails(seriesId: string | number): Promise<any> {
    try {
      // O formato do ID de série é sr-XXX se vier do adaptador, removemos o prefixo se existir
      const cleanId = String(seriesId).replace('sr-', '');
      return await this.client.getShow({ showId: Number(cleanId) });
    } catch (error) {
      console.error(`Erro ao buscar detalhes da série ${seriesId}:`, error);
      return null;
    }
  }

  /**
   * Obtém informações de EPG para um canal específico
   */
  async getEPG(streamId: number | string): Promise<XtreamEPG[]> {
    try {
      const epg = await this.client.getShortEPG({ channelId: streamId });
      return epg.epg_listings || [];
    } catch (error) {
      console.error(`Erro ao buscar EPG para o stream ${streamId}:`, error);
      return [];
    }
  }

  /**
   * Constrói a URL de streaming de forma independente, com extensão customizável
   */
  getStreamUrl(streamId: string | number, type: 'live' | 'movie' | 'series', extension: string = 'm3u8'): string {
    const { host, username, password } = xtreamConfig;
    const cleanId = String(streamId).replace(/^(tv-|mv-|sr-|liv-|vod-)/, '');
    
    if (type === 'live') {
      return `${host}/live/${username}/${password}/${cleanId}.${extension}`;
    } else if (type === 'movie') {
      return `${host}/movie/${username}/${password}/${cleanId}.${extension}`;
    } else {
      return `${host}/series/${username}/${password}/${cleanId}.${extension}`;
    }
  }
}

// Exporta uma instância única para uso em toda a aplicação
export const xtreamService = new XtreamService();
