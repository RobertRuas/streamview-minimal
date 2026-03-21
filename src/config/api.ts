/**
 * Configuração Global da API
 * 
 * Este arquivo centraliza a URL base do nosso backend (Express + Prisma).
 * 
 * Por que isso é uma boa prática?
 * 1. Evita "Hardcoding": Não precisamos digitar (ou esquecer de mudar)
 *    'http://localhost:3001' em 20 arquivos diferentes.
 * 2. Prepara para Deploy: Quando a aplicação for para a Vercel, Netlify ou 
 *    num VPS, basta criar uma variável de ambiente chamada "VITE_API_URL"
 *    com a URL real de produção (ex: https://meustream.com/api).
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
