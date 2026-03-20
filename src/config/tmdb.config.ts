/**
 * Configuração da API TMDB utilizando variáveis de ambiente.
 * Documentação: https://developer.themoviedb.org/docs
 */
export const tmdbConfig = {
  // Chave de API do TMDB (Read Access Token v4)
  accessToken: import.meta.env.VITE_TMDB_ACCESS_TOKEN || '',
  // URL base da API TMDB
  apiBaseUrl: import.meta.env.VITE_TMDB_API_BASE_URL || 'https://api.themoviedb.org/3',
  // URL base para imagens do TMDB
  imageBaseUrl: import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p',
  // Tamanhos recomendados para as imagens
  posterSize: 'w500',
  backdropSize: 'original',
};
