import { Tv, Film, Clapperboard } from 'lucide-react';

interface TypeIconProps {
  type: string;
  className?: string;
}

// Icones para tipos de conteúdo
export function TypeIcon({ type, className }: TypeIconProps) {
  switch (type) {
    case 'TV': return <Tv className={className} />;
    case 'Movie': return <Film className={className} />;
    case 'Series': return <Clapperboard className={className} />;
    default: return null;
  }
}
