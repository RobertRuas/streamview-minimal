/// <reference types="vite/client" />

/**
 * Tipagem de todas as variáveis de ambiente do projeto.
 * Permite autocompletar e verificação de tipo ao usar import.meta.env.VITE_*.
 */
interface ImportMetaEnv {
  // Credenciais da API Xtream IPTV (obrigatórias)
  readonly VITE_XTREAM_USERNAME: string;
  readonly VITE_XTREAM_PASSWORD: string;
  readonly VITE_XTREAM_HOST: string;

  // API TMDB para capas e metadados (opcional)
  readonly VITE_TMDB_API_KEY: string;
  readonly VITE_TMDB_ACCESS_TOKEN: string;

  // Configurações de imagem (opcionais)
  readonly VITE_PLACEHOLDER_IMAGE: string;
  readonly VITE_ALLOWED_PROXY_DOMAINS: string;
  readonly VITE_IMAGE_PROXY_TARGET: string;

  // Controles do ambiente de desenvolvimento
  readonly DISABLE_HMR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
