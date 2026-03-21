import { useState, ReactNode } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface CategorySectionProps {
  title: string;
  icon: ReactNode;
  categories: Category[];
  contentType: string;
  hiddenList: { categoryId: string, contentType: string }[];
  onToggle: (categoryId: string, type: string) => void;
}

/**
 * Componente CategorySection (Settings)
 * Exibe uma lista colapsável de categorias para que o usuário possa ocultar/exibir.
 * Otimizado para TV com hover hints e feedback visual.
 */
export function CategorySection({ title, icon, categories, contentType, hiddenList, onToggle }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group text-white/80 font-bold border-l-2 border-purple-500 pl-3 py-2 bg-white/0 hover:bg-white/5 transition-all rounded-r-lg"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold">{title}</h3>
          <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{categories.length} totais</span>
        </div>
        <div className="flex items-center gap-2 text-white/20 group-hover:text-white/40 transition-colors">
          <span className="text-[10px] uppercase font-black tracking-widest">{isOpen ? 'Recolher' : 'Expandir'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-in slide-in-from-top-2 duration-300">
          {categories.map((cat) => {
            const isHidden = hiddenList.some((h) => h.categoryId === String(cat.id) && h.contentType === contentType);
            return (
              <button
                key={cat.id}
                onClick={() => onToggle(cat.id, contentType)}
                title={cat.name}
                className={`flex items-center justify-between p-3 group/item rounded-lg text-xs font-semibold transition-all border ${
                  isHidden 
                    ? 'bg-red-500/5 border-red-500/10 text-red-500/60' 
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                {isHidden ? (
                  <EyeOff className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                ) : (
                  <Eye className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover/item:opacity-100 text-white/40" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
