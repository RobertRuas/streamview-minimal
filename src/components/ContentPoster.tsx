import React, { useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdb.service';
import { ContentType } from '../types';
import { TypeIcon } from './TypeIcon';

interface ContentPosterProps {
  name: string;
  type: ContentType;
  fallbackUrl?: string;
  className?: string;
  imageClassName?: string;
  aspect?: 'video' | 'poster';
  children?: React.ReactNode;
}

/**
 * Componente que exibe a imagem do conteúdo, tentando buscar no TMDB se necessário.
 * Melhora banners de Filmes e Séries que vêm com placeholders genéricos.
 */
export function ContentPoster({ 
  name, 
  type, 
  fallbackUrl, 
  className = '', 
  imageClassName = '',
  aspect = 'video',
  children
}: ContentPosterProps) {
  // Lista de padrões comuns de placeholders que devem disparar busca no TMDB
  const placeholderPatterns = ['picsum.photos', 'placeholder', 'dummyimage', 'images/poster.png', 'images/movie.png', 'noposter'];
  
  // Identifica se a imagem atual é genérica ou se já é do TMDB
  const isGeneric = !fallbackUrl || placeholderPatterns.some(pattern => fallbackUrl.includes(pattern));
  const isInternalTMDB = !!fallbackUrl?.includes('tmdb.org');
  
  // Só tentamos o TMDB para Filmes e Séries que não tenham imagem oficial
  const shouldTryTMDB = (type === 'Movie' || type === 'Series') && !isInternalTMDB;

  // Inicia com null para evitar flash do placeholder enquanto busca no TMDB
  const [imageUrl, setImageUrl] = useState<string | null>(shouldTryTMDB && isGeneric ? null : (fallbackUrl || null));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Se não devemos buscar no TMDB (ex: Canal TV ou já é imagem TMDB)
    if (!shouldTryTMDB) {
      setImageUrl(fallbackUrl || null);
      setIsLoading(false);
      return;
    }

    // Se já é uma URL válida (não genérica), mantemos como fallback inicial
    if (!isGeneric && fallbackUrl) {
      setImageUrl(fallbackUrl);
    }

    // Busca no TMDB para enriquecer Filmes e Séries
    async function fetchTMDBImage() {
      setIsLoading(true);
      try {
        const isSeries = type === 'Series';
        const tmdbData = await tmdbService.searchContent(name, isSeries);
        
        if (tmdbData) {
          // Se for aspecto poster, usamos poster_path, senão backdrop_path
          const path = aspect === 'poster' ? tmdbData.poster_path : (tmdbData.backdrop_path || tmdbData.poster_path);
          const size = aspect === 'poster' ? 'w500' : 'original';
          const tmdbUrl = tmdbService.getImageUrl(path, size);
          
          if (tmdbUrl) {
            setImageUrl(tmdbUrl);
          }
        }
      } catch (error) {
        console.error(`[TMDB] Erro ao resolver imagem para ${name}:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTMDBImage();
  }, [name, type, fallbackUrl, aspect, shouldTryTMDB, isGeneric]);

  // Hack de proporção (Padding Hack) para suportar navegadores de TV antigos que não têm 'aspect-ratio'
  // 150% = 3/2 (Poster), 56.25% = 16/9 (Video)
  const paddingClass = aspect === 'poster' ? 'pb-[150%]' : 'pb-[56.25%]';

  return (
    <div className={`relative w-full ${paddingClass} bg-white/5 rounded-sm overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className={`w-full h-full object-cover transition-transform duration-700 ${imageClassName}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Caso a imagem falhe, voltamos para um placeholder seguro
              (e.target as HTMLImageElement).src = import.meta.env.VITE_PLACEHOLDER_IMAGE;
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            ) : (
              <TypeIcon type={type} className="w-8 h-8 text-white/10" />
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
