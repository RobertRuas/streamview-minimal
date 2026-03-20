// Configuração da API Xtream utilizando variáveis de ambiente
export const xtreamConfig = {
  // Usamos o proxy /api-proxy configurado no vite.config.ts para evitar erros de CORS no navegador
  host: '/api-proxy',
  username: import.meta.env.VITE_XTREAM_USERNAME || '',
  password: import.meta.env.VITE_XTREAM_PASSWORD || '',
};