import { useEffect, useState } from 'react';
import { useToastStore } from '../store/toast.store';
import { useAuthStore } from '../store/auth.store';
import { 
  Save, LayoutPanelLeft, Users,
  Film, Tv, PlaySquare
} from 'lucide-react';

// Novos componentes extraídos
import { CategorySection } from '../components/settings/CategorySection';
import { EditUserForm } from '../components/settings/EditUserForm';
import { UserManagementTable } from '../components/settings/UserManagementTable';
import { UserProfileCard } from '../components/settings/UserProfileCard';
import { TestDB } from '../components/settings/TestDB';
import { API_BASE_URL } from '../config/api';

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

interface Category {
  id: string;
  name: string;
}

interface SettingsProps {
  liveCategories: Category[];
  movieCategories: Category[];
  seriesCategories: Category[];
  hiddenCategories: { categoryId: string, contentType: string }[];
  onToggleCategory?: (categoryId: string, type: string) => void;
}

/**
 * Página de Configurações (Ajustes)
 * Centraliza o perfil do usuário, gerenciamento de categorias ocultas e painel administrativo.
 */
export function Settings({ 
  liveCategories, 
  movieCategories, 
  seriesCategories, 
  hiddenCategories, 
  onToggleCategory 
}: SettingsProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const { showToast } = useToastStore();
  const { user, token, updateUser } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  const fetchData = async () => {
    if (!token) return;
    try {
      if (isAdmin) {
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const usersJson = await usersRes.json();
        if (usersJson.success) {
          // Garante que maxDevices venha com o valor correto da API
          setAllUsers(usersJson.data);
        }
      }
    } catch (err) {
      setError('Falha ao sincronizar dados com o servidor.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, token]);

  const toggleHidden = async (categoryId: string, type: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/hidden-categories/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ categoryId, type })
      });
      const data = await res.json();
      if (data.success) {
        if (onToggleCategory) onToggleCategory(categoryId, type);
        showToast(data.hidden ? 'Categoria oculta com sucesso.' : 'Categoria tornada visível.', 'info');
      }
    } catch (err) {
      showToast('Erro ao atualizar categoria.', 'error');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/approve-user/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Acesso do usuário liberado!', 'success');
        fetchData();
      }
    } catch (err) { showToast('Erro de conexão.', 'error'); }
  };

  const handleRevoke = async (id: string, isSelf: boolean) => {
    if (isSelf && !confirm('Aviso: Você está bloqueando sua própria conta administrativa. Deseja continuar?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/revoke-user/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Acesso do usuário suspenso.', 'success');
        fetchData();
      }
    } catch (err) { showToast('Erro de conexão.', 'error'); }
  };

  const handleReject = async (id: string, isSelf: boolean) => {
    if (!confirm(isSelf ? 'CUIDADO: deseja excluir sua própria conta permanentemente?' : 'Deseja excluir este usuário permanentemente?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reject-user/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('E-mail e conta removidos da base de dados.', 'success');
        if (isSelf) useAuthStore.getState().logout();
        else fetchData();
      }
    } catch (err) { showToast('Erro de conexão.', 'error'); }
  };

  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedData: Partial<User>) => {
    if (!editingUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cadastro atualizado com sucesso!', 'success');
        setIsEditModalOpen(false);
        if (editingUser.id === user?.id) updateUser({ ...user, ...data.data } as any);
        fetchData();
      } else showToast(data.error || 'Erro ao atualizar dados.', 'error');
    } catch (err) { showToast('Erro na requisição.', 'error'); }
  };

  return (
    <div className="p-8 pb-40 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Ajustes & Configurações</h1>
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest pl-1">Customize sua experiência no Freedom Stream</p>
      </div>
      
      {error && <div className="text-red-500 bg-red-900/10 p-4 rounded-xl border border-red-500/20 font-bold text-center text-sm">{error}</div>}

      {/* Lista de Configurações Empilhadas Verticalmente (Full Width) */}
      <div className="space-y-8">
        
        {/* Perfil e Sessão */}
        <UserProfileCard 
          user={user as any} 
          onEdit={() => openEditModal({ ...user, active: true, createdAt: '', maxDevices: user?.maxDevices || 2 } as User)} 
        />

        {/* Filtros de Categorias */}
        <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <LayoutPanelLeft className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white/90">Filtros de Interface</h2>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Oculte categorias que você não assiste</p>
            </div>
          </div>
          
          <div className="space-y-10">
            <CategorySection 
              title="Lista de Canais TV" 
              icon={<Tv className="w-4 h-4 text-purple-400" />}
              categories={liveCategories}
              contentType="TV"
              hiddenList={hiddenCategories}
              onToggle={toggleHidden}
            />
            <CategorySection 
              title="Biblioteca de Filmes" 
              icon={<Film className="w-4 h-4 text-purple-400" />}
              categories={movieCategories}
              contentType="MOVIE"
              hiddenList={hiddenCategories}
              onToggle={toggleHidden}
            />
            <CategorySection 
              title="Catálogo de Séries" 
              icon={<PlaySquare className="w-4 h-4 text-purple-400" />}
              categories={seriesCategories}
              contentType="SERIES"
              hiddenList={hiddenCategories}
              onToggle={toggleHidden}
            />
          </div>
        </div>
      </div>

      {/* Área Administrativa (Full Width) */}
      {isAdmin && (
        <>
          <UserManagementTable 
            users={allUsers}
            currentUserId={user?.id}
            onEdit={openEditModal}
            onApprove={handleApprove}
            onRevoke={handleRevoke}
            onReject={handleReject}
          />

          {/* SESSÃO DE TESTES - EXPLORER DO BANCO DE DADOS */}
          <TestDB />
        </>
      )}

      {/* Modal de Edição */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-[#0f0f0f] border border-white/10 p-10 rounded-3xl w-full max-w-lg relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Editar Cadastro</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </button>
            </div>
            <EditUserForm 
              user={editingUser} 
              onSave={handleSaveUser} 
              onCancel={() => setIsEditModalOpen(false)}
              enableRoleChange={isAdmin && editingUser.id !== user?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
