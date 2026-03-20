/**
 * Tipagens para a API Xtream e o formato interno da aplicação
 */

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
  url?: string;
}

export interface XtreamMoviesListing {
  num: number;
  name: string;
  title: string;
  year: string | null;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: number;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  plot: string | null;
  cast: string | null;
  director: string | null;
  genre: string | null;
  youtube_trailer: string | null;
  url?: string;
}

export interface XtreamShowListing {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  rating: number;
  category_id: string;
  youtube_trailer: string | null;
}

export interface XtreamEPG {
  id: string;
  start: string;
  end: string;
  title: string;
  description: string;
  start_timestamp: string;
  stop_timestamp: string;
}

// Formato de saída para a aplicação (baseado em src/types.ts e ContentItem)
export type ContentType = 'TV' | 'Movie' | 'Series';

export interface BaseContentItem {
  id: string;
  name: string;
  category: string;
  type: ContentType;
  isFavorite: boolean;
  imageUrl: string;
  description: string;
  streamUrl?: string;
  progress?: number;
  rating?: string | number;
  year?: string | number;
  cast?: string;
  director?: string;
  genre?: string;
}

export interface Episode {
  id: string;
  name: string;
  duration: string;
  progress: number;
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface SeriesContentItem extends BaseContentItem {
  type: 'Series';
  seasons?: Season[];
}

export type AppContentItem = BaseContentItem | SeriesContentItem;
