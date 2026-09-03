import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, TrendingDown, Activity, CreditCard } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KpiCard from './KpiCard';

const SLATE_GRID = '#1e293b';

export default function FraudDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/pix-fraud-dashboard-metrics')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setMetrics(data);
        } else {
          setErroApi(true);
        }
      })
      .catch(() => setErroApi(true))
      .finally(() => setLoading(false));
  }, []);

  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return "R$ 0,00";
    if (Math.abs(valor) >= 1e12) return `R$ ${(valor / 1e12).toFixed(1)} tri`;
    if (Math.abs(valor) >= 1e9) return `R$ ${(valor / 1e9).toFixed(1)}B`;
    if (Math.abs(valor) >= 1e6) return `R$ ${(valor / 1e6).toFixed(1)}M`;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-lg border border-slate-800/80">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Panorama do Ecossistema Pix, Fraudes & MED</h2>
          <p className="text-sm text-slate-400 mt-1">
            Correlação entre o volume geral de transações do Pix e as ocorrências de fraudes baseadas nos dados oficiais do Banco Central.
          </p>
        </div>
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-medium">
          {loading ? 'Sincronizando' : erroApi ? 'Modo Offline' : 'Dados Oficiais Ativos'}
        </span>
      </div>

      {erroApi && (
        <div className="p-4 bg-amber-950/40 border border-amber-700/50 text-amber-300 rounded-lg text-xs">
          Não foi possível conectar ao endpoint de métricas Pix/Fraude.
        </div>
      )}

      {/* Cartões KPIs Expandidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          icon={CreditCard} 
          title="Volume Geral Transacionado (Pix)" 
          value={formatarMoeda(metrics?.valor_transacoes_geral)} 
        />
        <KpiCard 
          icon={DollarSign} 
          title="Valor Total Contestado (Fraude)" 
          value={formatarMoeda(metrics?.valor_total_envolvido)} 
        />
        <KpiCard 
          icon={ShieldAlert} 
          title="Total de Pix Contestados" 
          value={metrics?.quantidade_fraudes_total?.toLocaleString('pt-BR') ?? '--'} 
        />
        <KpiCard 
          icon={TrendingDown} 
          title="Taxa Média de Devolução (MED)" 
          value={`${metrics?.taxa_recuperacao_media ?? '--'}%`} 
        />
      </div>

      {/* Gráficos de Correlação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80">
          <h3 className="text-sm font-medium text-white mb-1">Evolução do Volume Financeiro: Geral vs. Fraudes</h3>
          <p className="text-xs text-slate-500 mb-4">Comparativo mensal entre o montante líquido transacionado e o contestado (R$)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={metrics?.evolucao_temporal || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} formatter={formatarMoeda} />
              <Area type="monotone" dataKey="valor_transacoes" name="Volume Geral Pix" stroke="#38bdf8" strokeWidth={2} fill="#38bdf8" fillOpacity={0.1} />
              <Area type="monotone" dataKey="valor_envolvido" name="Valor Contestado/Fraude" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80">
          <h3 className="text-sm font-medium text-white mb-1">Evolução de Ocorrências (Contestações Mensais)</h3>
          <p className="text-xs text-slate-500 mb-4">Volume total de contestações aceitas no ecossistema</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={metrics?.evolucao_temporal || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="quantidade_fraudes" name="Qtd. Contestações" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}