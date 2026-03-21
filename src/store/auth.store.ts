import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  viewMode: 'grid' | 'list';
  paymentDate?: string | Date | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  deviceAutoLogin: boolean;
  login: (token: string, user: User) => void;
  logout: (fingerprint?: string) => Promise<void>;
  updateUser: (user: User) => void;
  setDeviceAutoLogin: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      deviceAutoLogin: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      setDeviceAutoLogin: (status) => set({ deviceAutoLogin: status }),
      logout: async (fingerprint) => {
        if (fingerprint) {
          try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fingerprint }),
            });
          } catch (err) {
            console.error('Erro ao encerrar sessão no servidor:', err);
          }
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'streamview-auth-storage', // Nome da chave no LocalStorage
    }
  )
);
