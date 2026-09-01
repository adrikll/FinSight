import React, { useState } from 'react';
import { Search, UserCheck, ShieldAlert, Activity, FileText } from 'lucide-react';

export default function Customer360() {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/customer-360/${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Cliente não encontrado ou erro na API.');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Não foi possível carregar a Visão 360° para este cliente.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-purple-400" />
          Visão 360° do Cliente
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Consolidação de dados relacionais (PostgreSQL) e trilha comportamental (Cosmos DB) por cliente.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome do cliente (ex: Adriane, Gabriel, Adriano Silva)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl text-white transition-all shadow-lg shadow-purple-600/30 text-sm"
          >
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-700 text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Cliente Selecionado</span>
              <h3 className="text-xl font-black text-white">{data.customer_name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total de Operações</span>
              <p className="text-lg font-black text-purple-400">{data.total_propostas} Registro(s)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Histórico de Propostas (PostgreSQL) */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Histórico de Propostas (PostgreSQL)
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.propostas.length > 0 ? (
                  data.propostas.map((prop, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${prop.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {prop.status}
                        </span>
                        <span className="text-xs font-bold text-amber-400">Rating {prop.risk_rating}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        <div>Solicitado: <strong className="text-white">R$ {prop.requested_amount.toLocaleString('pt-BR')}</strong></div>
                        <div>Aprovado: <strong className="text-emerald-400">R$ {prop.approved_limit.toLocaleString('pt-BR')}</strong></div>
                      </div>
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/80 p-2 rounded-lg">Motivo: {prop.decision_reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Nenhuma proposta encontrada no PostgreSQL para este nome.</p>
                )}
              </div>
            </div>

            {/* Trilha Comportamental (Cosmos DB) */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Trilha de Eventos (Cosmos DB)
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.eventos_comportamentais.length > 0 ? (
                  data.eventos_comportamentais.map((ev, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{new Date(ev.timestamp).toLocaleString('pt-BR')}</span>
                        <span className="text-cyan-400 font-semibold">{ev.decision}</span>
                      </div>
                      <p className="text-xs text-white font-medium">Consulta de Crédito Realizada</p>
                      <div className="text-xs text-slate-300 flex justify-between pt-1">
                        <span>Valor: R$ {ev.requested_amount?.toLocaleString('pt-BR')}</span>
                        <span className="text-purple-400">PD: {(ev.pd_score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Nenhum evento registrado no NoSQL para este nome.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}