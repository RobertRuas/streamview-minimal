import { useState } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

interface EditUserFormProps {
  user: User;
  onSave: (data: any) => void;
  onCancel: () => void;
  enableRoleChange: boolean;
}

/**
 * Componente EditUserForm (Settings)
 * Formulário simples para edição de e-mail, nome e papel do usuário pelo Admin.
 */
export function EditUserForm({ user, onSave, onCancel, enableRoleChange }: EditUserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState('');

  return (
    <form 
      className="space-y-6" 
      onSubmit={(e) => { 
        e.preventDefault(); 
        onSave({ name, email, role, password }); 
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <label className="block">
          <span className="text-xs text-white/40 uppercase font-black tracking-widest block mb-2 px-1">Nome Completo</span>
          <input 
            placeholder="Ex: João da Silva" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg p-3.5 text-white/90 focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10"
          />
        </label>
        
        <label className="block">
          <span className="text-xs text-white/40 uppercase font-black tracking-widest block mb-2 px-1">Endereço de E-mail</span>
          <input 
            placeholder="exemplo@servidor.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg p-3.5 text-white/90 focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10"
          />
        </label>

        <label className="block">
          <span className="text-xs text-white/40 uppercase font-black tracking-widest block mb-2 px-1">Nova Senha (opcional)</span>
          <input 
            type="password" 
            placeholder="Digite somente se quiser alterar..." 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg p-3.5 text-white/90 focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10"
          />
        </label>
        
        {enableRoleChange && (
          <label className="block">
            <span className="text-xs text-white/40 uppercase font-black tracking-widest block mb-2 px-1">Nível de Acesso</span>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as any)} 
              className="w-full bg-black border border-white/10 rounded-lg p-3.5 text-white/90 focus:border-blue-500/50 outline-none transition-all"
            >
              <option value="USER">Usuário (Assinante)</option>
              <option value="ADMIN">Administrador (Total)</option>
            </select>
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-lg transition-all font-bold"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-lg font-black transition-all shadow-lg shadow-blue-500/20"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
