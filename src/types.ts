/**
 * Barrel de re-exportação dos tipos da aplicação.
 * Mantém compatibilidade com todos os imports existentes (ex: import { ContentItem } from '../types').
 * Os tipos estão definidos em src/types/app.types.ts e src/types/xtream.types.ts.
 */
export type {
  ContentType,
  Episode,
  Season,
  ContentItem,
  ViewMode,
  Page,
} from './types/app.types';
