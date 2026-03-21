import { useState, useEffect } from 'react';
import { Database, Table, Search, ChevronDown, ListFilter, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { API_BASE_URL } from '../../config/api';

/**
 * Componente TestDB (Settings)
 * VISÍVEL APENAS PARA ADMIN - Sessão de Testes do Banco de Dados.
 * Permite visualizar o conteúdo das tabelas do Prisma (PostgreSQL) em tempo real via dropdown.
 */
export function TestDB() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [dbResults, setDbResults] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Tabelas Disponíveis (Retornadas pela API db-preview)
  const availableTables = [
    { id: 'users', name: 'Usuários (Users)', icon: <ListFilter className="w-4 h-4" /> },
    { id: 'settings', name: 'Configurações (Settings)', icon: <Search className="w-4 h-4" /> },
    { id: 'devices', name: 'Dispositivos (Devices)', icon: <ListFilter className="w-4 h-4" /> },
    { id: 'favorites', name: 'Favoritos (Favorites)', icon: <Database className="w-4 h-4" /> },
    { id: 'progress', name: 'Progresso (Progress)', icon: <Table className="w-4 h-4" /> },
  ];

  // Carregar os dados do backend
  const fetchDBData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/db-preview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDbResults(data.data);
      } else {
        setError(data.error || 'Erro ao carregar banco de dados.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchDBData();
  }, [isAdmin, token]);

  if (!isAdmin) return null;

  // Lógica de Filtragem (Se houver busca)
  const dataToShow = dbResults?.[selectedTable] || [];
  const filteredData = dataToShow.filter((row: any) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
  );

  // Pega as chaves lógicas para o Header da tabela (baseado no primeiro registro)
  const tableHeaders = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="bg-[#111] p-8 rounded-3xl border border-white/5 border-dashed space-y-8 shadow-2xl mt-12 mb-20">

      {/* Cabeçalho da Sessão */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <Database className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Testes: DB Explorer</h3>
            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-0.5">Visão bruta das tabelas Prisma em tempo real</p>
          </div>
        </div>

        {/* Seleção e Filtro */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white/80 appearance-none focus:outline-none focus:border-red-500/50 transition-all cursor-pointer pr-10"
            >
              {availableTables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              type="text"
              placeholder="Buscar na tabela..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/10"
            />
          </div>

          <button
            onClick={fetchDBData}
            title="Sincronizar DB"
            className="p-2.5 bg-red-500/5 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/10 transition-all font-bold text-xs uppercase"
          >
            {isLoading ? '...' : 'Att'}
          </button>
        </div>
      </div>

      {/* Tabela de Dados */}
      {error ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 border border-red-500/20 rounded-2xl bg-red-500/5">
          <AlertTriangle className="w-10 h-10 text-red-500/40" />
          <p className="text-red-500/60 font-bold text-sm tracking-tight">{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white/[0.03] text-white/20 uppercase text-[9px] font-black tracking-widest border-b border-white/5">
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h} className="px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.length > 0 ? filteredData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    {tableHeaders.map(h => (
                      <td key={h} className="px-5 py-4 font-mono text-[10px] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={tableHeaders.length || 1} className="px-6 py-20 text-center text-white/10 font-bold uppercase tracking-widest text-xs">
                      {isLoading ? 'Carregando Banco de Dados...' : 'Nenhum dado encontrado nesta tabela.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer da Sessão */}
      <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-white/10">
        <Database className="w-3 h-3" />
        <span>Modo de Inspeção Administrador - Use com Cautela</span>
      </div>
    </div>
  );
}
