import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { API_BASE_URL } from '../config/api';

interface LoginProps {
  onRegisterClick: () => void;
}

export function Login({ onRegisterClick }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        const fingerprint = result.visitorId;

        const res = await fetch(`${API_BASE_URL}/auth/auto-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint })
        });
        const data = await res.json();
        if (data.success) {
          useAuthStore.setState({ deviceAutoLogin: data.data.device?.autoLogin });
          login(data.data.token, data.data.user);
        }
      } catch (err) {
        // Falha no auto-login: usuário preenche o form normalmente
      }
    };
    tryAutoLogin();
  }, [login]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Gera Fingerprint Único da TV/PC
      const fp = await fpPromise.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      // Coleta o nome amigável do Browser
      const deviceName = `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`;

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fingerprint, deviceName }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data.token, data.data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o Servidor de Autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
          <p className="text-white/50 text-sm">Acesse o StreamView com sua conta</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-white/70 text-sm mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-lg py-3 hover:bg-white/90 focus:outline-none transition-colors disabled:opacity-50"
          >
            {loading ? 'Acessando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/50">
          Não tem uma conta?{' '}
          <button onClick={onRegisterClick} className="text-white hover:underline focus:outline-none">
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
