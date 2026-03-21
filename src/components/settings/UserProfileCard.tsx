import { useState } from 'react';
import { User as UserIcon, Edit, Mail, ShieldCheck, UserCheck, Laptop, Loader2, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useToastStore } from '../../store/toast.store';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { API_BASE_URL } from '../../config/api';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  paymentDate?: string | Date | null; // Data de pagamento opcional
}

interface UserProfileCardProps {
  user: User | null;
  onEdit: () => void;
}

/**
 * Componente UserProfileCard (Settings)
 * Versão Minimalista e Compacta.
 */
export function UserProfileCard({ user, onEdit }: UserProfileCardProps) {
  const { token, deviceAutoLogin, setDeviceAutoLogin } = useAuthStore();
  const { showToast } = useToastStore();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const handleToggleAutoLogin = async () => {
    setIsUpdating(true);
    try {
      const fp = await fpPromise.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      const newStatus = !deviceAutoLogin;
      const res = await fetch(`${API_BASE_URL}/devices/auto-login`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fingerprint, autoLogin: newStatus })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setDeviceAutoLogin(newStatus);
        showToast(newStatus ? 'Login automático ativado nesta TV/PC.' : 'Login automático desativado.', 'success');
      } else {
        showToast(data.error || `Erro do servidor (${res.status}).`, 'error');
      }
    } catch (err) {
      console.error('Auto login toggle error:', err);
      showToast('Erro de comunicação. Verifique a conexão ou se o servidor está online.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/5 shadow-xl transition-all duration-300">
      
      {/* Header Compacto: Nome e Único Botão de Editar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase italic leading-none">
              {user.name || 'Assinante Master'}
            </h2>
            <span className="text-[9px] text-white/20 uppercase font-black tracking-widest block mt-0.5">ID: {user.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
        
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 bg-white/5 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-bold uppercase text-[10px] tracking-widest border border-white/10 hover:border-blue-500"
        >
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
      </div>

      {/* Grid Horizontal Minimalista (Apenas E-mail e Nível) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* E-mail de Login */}
        <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.03]">
          <div className="text-white/20">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">Login</p>
            <p className="text-xs text-white/60 font-medium truncate lowercase">{user.email}</p>
          </div>
        </div>

        {/* Plano de Acesso */}
        <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.03]">
          <div className={`text-${user.role === 'ADMIN' ? 'yellow-500/50' : 'blue-500/50'}`}>
            {user.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">Plano</p>
            <p className={`text-xs font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'text-yellow-500' : 'text-blue-500'}`}>
              {user.role === 'ADMIN' ? 'Administrador' : 'Assinante Master'}
            </p>
          </div>
        </div>

        {/* Data de Pagamento / Vencimento (Opcional) */}
        {user.paymentDate && (
          <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.03]">
            <div className="text-white/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">Vencimento</p>
              <p className="text-xs text-white/60 font-medium tracking-tight">
                {new Date(user.paymentDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Seção de Auto Login */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Login Automático Neste Dispositivo</p>
            <p className="text-[9px] text-white/40 tracking-widest mt-0.5">Pular tela de senha ao abrir a plataforma</p>
          </div>
        </div>
        
        <button 
          onClick={handleToggleAutoLogin}
          disabled={isUpdating}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none flex items-center shrink-0 ${deviceAutoLogin ? 'bg-purple-600' : 'bg-white/10'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUpdating && <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white animate-spin" />}
          <span 
            className={`absolute left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${deviceAutoLogin ? 'translate-x-5' : 'translate-x-0'} ${isUpdating ? 'opacity-0' : 'opacity-100'}`} 
          />
        </button>
      </div>
    </div>
  );
}
