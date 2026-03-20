import { ReactNode } from 'react';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
  hideLabel?: boolean;
}

export function NavItem({ 
  icon, 
  label, 
  active, 
  onClick, 
  small = false,
  hideLabel = false
}: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      title={hideLabel ? label : undefined}
      className={`w-full flex items-center rounded-sm transition-all text-left outline-none focus:bg-white/20 focus:text-white ${
        hideLabel ? 'justify-center p-3' : 'gap-4 px-4 py-3'
      } ${
        active 
          ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]' 
          : 'text-white/40 hover:bg-white/5 hover:text-white/60'
      } ${small ? 'text-xs' : 'text-base lg:text-sm font-medium'}`}
    >
      <span className={`transition-transform duration-300 ${hideLabel ? 'scale-125' : (small ? 'scale-90 opacity-60' : 'scale-110')}`}>
        {icon}
      </span>
      {!hideLabel && <span className="truncate">{label}</span>}
    </button>
  );
}
