import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, TrendingDown, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import KpiCard from './KpiCard';
import API_URL from '../api';

const SLATE_GRID = '#1e293b';
const CHART_COLORS = ['#51138c', '#38bdf8', '#fb923c', '#9f4cf1', '#37a487', '#f97316'];

const renderCustomLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5">
          <span 
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function FraudDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/pix-fraud-dashboard-metrics`)
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

  const formatarNumeroInteligente = (valor) => {
    if (valor === undefined || valor === null) return "--";
    if (Math.abs(valor) >= 1e9) return `${(valor / 1e9).toFixed(2)}B`;
    if (Math.abs(valor) >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
    if (Math.abs(valor) >= 1e3) return `${(valor / 1e3).toFixed(1)} mil`;
    return valor.toLocaleString('pt-BR');
  };

  const formatarEixoYContestacoes = (valor) => {
    if (valor === undefined || valor === null) return "0";
    if (Math.abs(valor) >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
    if (Math.abs(valor) >= 1e3) return `${(valor / 1e3).toFixed(0)}k`;
    return valor.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6 pb-6 transition-colors">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panorama do Ecossistema Pix, Fraudes & MED</h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Análise profunda baseada nos dados oficiais do Banco Central.
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold">
          {loading ? 'Sincronizando' : erroApi ? 'Modo Offline' : 'Dados Oficiais Ativos'}
        </span>
      </div>

      {erroApi && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          Não foi possível conectar ao endpoint de métricas Pix/Fraude.
        </div>
      )}

      {/* 6 KPIs Dinâmicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={CreditCard} title="Volume Transacionado" value={formatarMoeda(metrics?.valores_atuais?.transacoes)} delta={metrics?.deltas?.transacoes} trend={metrics?.series_kpis?.transacoes} />
        <KpiCard icon={DollarSign} title="Valor Contestado" value={formatarMoeda(metrics?.valores_atuais?.fraudes_valor)} delta={metrics?.deltas?.fraudes_valor} trend={metrics?.series_kpis?.fraudes_valor} />
        <KpiCard icon={ShieldAlert} title="Total de Contestações" value={formatarNumeroInteligente(metrics?.valores_atuais?.fraudes_qtd)} delta={metrics?.deltas?.fraudes_qtd} trend={metrics?.series_kpis?.fraudes_qtd} />
        <KpiCard icon={TrendingDown} title="Taxa Devolução MED" value={`${metrics?.valores_atuais?.taxa_rec ?? '--'}%`} delta={metrics?.deltas?.taxa_rec} trend={metrics?.series_kpis?.taxa_rec} />
        <KpiCard icon={Lock} title="Bloqueios Cautelares Dev." value={formatarMoeda(metrics?.valores_atuais?.bloqueados)} delta={metrics?.deltas?.bloqueados} trend={metrics?.series_kpis?.bloqueados} />
        <KpiCard icon={AlertTriangle} title="Residual Não Devolvido" value={formatarMoeda(metrics?.valores_atuais?.residual)} delta={metrics?.deltas?.residual} trend={metrics?.series_kpis?.residual} />
      </div>

      {/* 6 Gráficos organizados em 3 Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução Financeira */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Evolução Financeira</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Montante transacionado e contestado (R$)</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.evolucao_temporal || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={50} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Area type="monotone" dataKey="valor_transacoes" name="Volume Geral" stroke="#38bdf8" strokeWidth={2} fill="url(#colorTrans)" />
                <Area type="monotone" dataKey="valor_envolvido" name="Contestado" stroke="#a855f7" strokeWidth={2} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Liquidez e risco temporal
          </div>
        </div>

        {/* Gráfico 2: Top Regiões Pagadoras */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Top Regiões Pagadoras</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Concentração regional do volume</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie 
                  data={metrics?.por_regiao || []} 
                  dataKey="valor" 
                  nameKey="regiao" 
                  outerRadius={65} 
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(metrics?.por_regiao || []).map((_, index) => (
                    <Cell key={`cell-reg-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatarMoeda(val), "Volume"]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Participação por região
          </div>
        </div>

        {/* Gráfico 3: Motivos de Não Devolução (MED) */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Motivos de Não Devolução</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Fatores de impedimento</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie 
                  data={metrics?.motivos_nao_devolucao || []} 
                  dataKey="valor" 
                  nameKey="motivo" 
                  innerRadius={35} 
                  outerRadius={65} 
                  paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(metrics?.motivos_nao_devolucao || []).map((_, index) => (
                    <Cell key={`cell-mot-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatarMoeda(val), "Restante"]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Gargalos operacionais
          </div>
        </div>

        {/* Gráfico 4: Comparativo de Contestações */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Comparativo de Contestações</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Aceitas vs. Rejeitadas</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.evolucao_temporal || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarEixoYContestacoes} width={40} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="quantidade_fraudes" name="Aceitas" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fraudes_rejeitadas" name="Rejeitadas" stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Dinâmica de aprovação
          </div>
        </div>

        {/* Gráfico 5: Volume por Faixa Etária */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Volume por Faixa Etária</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Montante por perfil de idade</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metrics?.por_faixa_etaria || []} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
                <YAxis type="category" dataKey="faixa" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {(metrics?.por_faixa_etaria || []).map((_, index) => (
                    <Cell key={`cell-fx-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Distribuição demográfica
          </div>
        </div>

        {/* Gráfico 6: Natureza da Transação Pix */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Natureza da Transação Pix</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Classificação dos fluxos</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.por_natureza || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="natureza" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={50} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc', fontSize: '12px' }} 
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {(metrics?.por_natureza || []).map((_, index) => (
                    <Cell key={`cell-nat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Análise estrutural
          </div>
        </div>

      </div>
    </div>
  );
}