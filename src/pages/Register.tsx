import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

interface RegisterProps {
  onLoginClick: () => void;
}

export function Register({ onLoginClick }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onLoginClick();
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o Servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-white/50 text-sm">Cadastre-se para acessar o StreamView</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-white/70 text-sm mb-2">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              placeholder="João da Silva"
            />
          </div>

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
              minLength={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-white text-black font-semibold rounded-lg py-3 hover:bg-white/90 focus:outline-none transition-colors disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/50">
          Já tem uma conta?{' '}
          <button onClick={onLoginClick} className="text-white hover:underline focus:outline-none">
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
}
