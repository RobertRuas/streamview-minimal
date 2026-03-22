import { 
  Users, Search, Mail, ShieldCheck, UserCheck, Calendar, 
  Edit, Ban, CheckCircle, Trash2 
} from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
  maxDevices: number;
  paymentDate?: string | Date | null;
}

interface UserManagementTableProps {
  users: User[];
  currentUserId: string | undefined;
  onEdit: (user: User) => void;
  onRevoke: (id: string, isSelf: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, isSelf: boolean) => void;
}

/**
 * Componente UserManagementTable (Settings)
 * Tabela completa de administração de usuários com busca e ações.
 */
export function UserManagementTable({ 
  users, 
  currentUserId, 
  onEdit, 
  onRevoke, 
  onApprove, 
  onReject 
}: UserManagementTableProps) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#111] p-6 rounded-xl border border-white/5 space-y-6 shadow-2xl">
      {/* Header e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 rounded-lg">
            <Users className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white/90 tracking-tight">Gestão de Usuários</h2>
            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-0.5">
              {users.length} contas registradas no sistema
            </p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-yellow-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 transition-all font-medium placeholder:text-white/10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.03] text-white/30 uppercase text-[10px] font-black tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-6 py-5">Usuário / ID</th>
                <th className="px-6 py-5 text-center">Nível</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5">Vencimento</th>
                <th className="px-6 py-5">Data Cadastro</th>
                <th className="px-6 py-5 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length > 0 ? filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-white group-hover:text-yellow-500 transition-colors uppercase tracking-tight text-sm">
                        {u.name || u.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-white/20 flex items-center gap-1.5 mt-1 font-medium lowercase">
                        <Mail className="w-3.5 h-3.5" /> {u.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-center">
                      {u.role === 'ADMIN' ? (
                        <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-3 py-1.5 rounded-lg w-fit">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-400 bg-blue-400/5 border border-blue-400/20 px-3 py-1.5 rounded-lg w-fit">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">User</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-center">
                      {u.active ? (
                        <span className="flex items-center gap-2 text-green-500 font-black text-[9px] uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-500 font-black text-[9px] uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2.5 text-white/40 text-xs font-bold">
                      {u.paymentDate ? (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {new Date(u.paymentDate).toLocaleDateString('pt-BR')}
                        </>
                      ) : (
                        <span className="opacity-20 uppercase text-[9px] font-black">S/ Vencimento</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2.5 text-white/40 text-xs font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(u.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button 
                        onClick={() => onEdit(u)} 
                        title="Configurar Usuário"
                        className="p-2.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 rounded-xl transition-all border border-transparent hover:border-blue-600/30"
                      >
                        <Edit className="w-4 h-4 text-white/60"/>
                      </button>
                      
                      <button 
                        onClick={() => u.active ? onRevoke(u.id, u.id === currentUserId) : onApprove(u.id)} 
                        title={u.active ? "Desativar Conta" : "Ativar Conta"}
                        className={`p-2.5 rounded-xl transition-all border ${
                          u.active 
                            ? 'bg-white/5 border-transparent hover:bg-orange-600/20 hover:text-orange-400 hover:border-orange-600/30' 
                            : 'bg-green-600/10 border-green-600/20 text-green-500 hover:bg-green-600/20'
                        }`}
                      >
                        {u.active ? <Ban className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                      </button>

                      <button 
                        onClick={() => onReject(u.id, u.id === currentUserId)} 
                        title="Deletar permanentemente"
                        className="p-2.5 bg-white/5 border-transparent hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-white/40"/>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-5 bg-white/5 rounded-full">
                        <Users className="w-12 h-12 text-white/5" />
                      </div>
                      <div>
                        <p className="text-white/60 font-bold">Nenhum usuário encontrado</p>
                        <p className="text-white/20 text-xs mt-1">Tente buscar por termos diferentes ou verifique a ortografia.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
