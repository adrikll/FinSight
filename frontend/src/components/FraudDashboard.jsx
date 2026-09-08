import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, TrendingDown, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import KpiCard from './KpiCard';

const SLATE_GRID = '#1e293b';
const CHART_COLORS = ['#51138c', '#38bdf8', '#fb923c', '#9f4cf1', '#37a487', '#f97316'];

// Legenda customizada com marcadores circulares
const renderCustomLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5">
          <span 
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[10px] text-slate-300">{entry.value}</span>
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

  // Formatação limpa para números inteiros grandes (ex: Total de Contestações)
  const formatarNumeroInteligente = (valor) => {
    if (valor === undefined || valor === null) return "--";
    if (Math.abs(valor) >= 1e9) return `${(valor / 1e9).toFixed(2)}B`;
    if (Math.abs(valor) >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
    if (Math.abs(valor) >= 1e3) return `${(valor / 1e3).toFixed(1)} mil`;
    return valor.toLocaleString('pt-BR');
  };

  // Formatação abreviada para o eixo Y de contestações
  const formatarEixoYContestacoes = (valor) => {
    if (valor === undefined || valor === null) return "0";
    if (Math.abs(valor) >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
    if (Math.abs(valor) >= 1e3) return `${(valor / 1e3).toFixed(0)}k`;
    return valor.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-lg border border-slate-800/80">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Panorama do Ecossistema Pix, Fraudes & MED</h2>
          <p className="text-sm text-slate-400 mt-1">
            Análise profunda de transações e mecanismos de ressarcimento baseados nos dados oficiais do Banco Central.
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

      {/* 6 KPIs Dinâmicos com Sparklines e Deltas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard 
          icon={CreditCard} 
          title="Volume Transacionado" 
          value={formatarMoeda(metrics?.valores_atuais?.transacoes)} 
          delta={metrics?.deltas?.transacoes}
          trend={metrics?.series_kpis?.transacoes}
        />
        <KpiCard 
          icon={DollarSign} 
          title="Valor Contestado" 
          value={formatarMoeda(metrics?.valores_atuais?.fraudes_valor)} 
          delta={metrics?.deltas?.fraudes_valor}
          trend={metrics?.series_kpis?.fraudes_valor}
        />
        <KpiCard 
          icon={ShieldAlert} 
          title="Total de Contestações" 
          value={formatarNumeroInteligente(metrics?.valores_atuais?.fraudes_qtd)} 
          delta={metrics?.deltas?.fraudes_qtd}
          trend={metrics?.series_kpis?.fraudes_qtd}
        />
        <KpiCard 
          icon={TrendingDown} 
          title="Taxa Devolução MED" 
          value={`${metrics?.valores_atuais?.taxa_rec ?? '--'}%`} 
          delta={metrics?.deltas?.taxa_rec}
          trend={metrics?.series_kpis?.taxa_rec}
        />
        <KpiCard 
          icon={Lock} 
          title="Bloqueios Cautelares Dev." 
          value={formatarMoeda(metrics?.valores_atuais?.bloqueados)} 
          delta={metrics?.deltas?.bloqueados}
          trend={metrics?.series_kpis?.bloqueados}
        />
        <KpiCard 
          icon={AlertTriangle} 
          title="Residual Não Devolvido" 
          value={formatarMoeda(metrics?.valores_atuais?.residual)} 
          delta={metrics?.deltas?.residual}
          trend={metrics?.series_kpis?.residual}
        />
      </div>

      {/* 6 Gráficos Dispostos em 3 Colunas (Reordenados conforme solicitação) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução Financeira */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Evolução Financeira: Geral vs. Fraudes</h3>
            <p className="text-xs text-slate-500 mb-4">Montante transacionado e contestado (R$)</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.evolucao_temporal || []} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
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
                <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={50} />
                <Tooltip 
                  cursor={false}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}
                  formatter={(val, name) => [formatarMoeda(val), name]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} 
                />
                <Area type="monotone" dataKey="valor_transacoes" name="Volume Geral" stroke="#38bdf8" strokeWidth={2} fill="url(#colorTrans)" />
                <Area type="monotone" dataKey="valor_envolvido" name="Contestado" stroke="#a855f7" strokeWidth={2} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Liquidez e risco temporal
          </div>
        </div>

        {/* Gráfico 2: Top Regiões Pagadoras (Movido para a 2ª posição) */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Top Regiões Pagadoras</h3>
            <p className="text-xs text-slate-500 mb-2">Concentração regional do volume</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie 
                  data={metrics?.por_regiao || []} 
                  dataKey="valor" 
                  nameKey="regiao" 
                  outerRadius={65} 
                  innerRadius={0}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(metrics?.por_regiao || []).map((_, index) => (
                    <Cell key={`cell-reg-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatarMoeda(val), "Volume"]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} 
                />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Participação por região geográfica
          </div>
        </div>

        {/* Gráfico 3: Motivos de Não Devolução (Movido para a 3ª posição) */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Motivos de Não Devolução (MED)</h3>
            <p className="text-xs text-slate-500 mb-2">Fatores que impediram o ressarcimento</p>
          </div>
          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie 
                  data={metrics?.motivos_nao_devolucao || []} 
                  dataKey="valor" 
                  nameKey="motivo" 
                  innerRadius={38} 
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
                  formatter={(val) => [formatarMoeda(val), "Valor Restante"]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} 
                />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Gargalos operacionais do mecanismo
          </div>
        </div>

        {/* Gráfico 4: Comparativo de Contestações (Com Eixo Y Formatado e movido para a 4ª posição) */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Comparativo de Contestações</h3>
            <p className="text-xs text-slate-500 mb-4">Aceitas vs. Rejeitadas ao longo do tempo</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.evolucao_temporal || []} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatarEixoYContestacoes} width={45} />
                <Tooltip 
                  cursor={false}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}
                  formatter={(val, name) => [val.toLocaleString('pt-BR'), name]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="quantidade_fraudes" name="Aceitas" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fraudes_rejeitadas" name="Rejeitadas" stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Dinâmica de aprovação de contestações
          </div>
        </div>

        {/* Gráfico 5: Volume por Faixa Etária */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Volume por Faixa Etária</h3>
            <p className="text-xs text-slate-500 mb-4">Montante transacionado por perfil de idade</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metrics?.por_faixa_etaria || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
                <YAxis type="category" dataKey="faixa" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip 
                  cursor={false}
                  formatter={(val) => [formatarMoeda(val), "Volume"]}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}
                  itemStyle={{ color: '#38bdf8', fontSize: '11px', padding: 0 }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11, color: '#f8fafc' }} 
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {(metrics?.por_faixa_etaria || []).map((_, index) => (
                    <Cell key={`cell-fx-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Distribuição demográfica de pagadores
          </div>
        </div>

        {/* Gráfico 6: Natureza da Transação Pix */}
        <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Natureza da Transação Pix</h3>
            <p className="text-xs text-slate-500 mb-4">Classificação dos fluxos financeiros</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.por_natureza || []} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="natureza" tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={50} />
                <Tooltip 
                  cursor={false}
                  formatter={(val) => [formatarMoeda(val), "Volume"]}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}
                  itemStyle={{ color: '#b175e9', fontSize: '11px', padding: 0 }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11, color: '#f8fafc' }} 
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {(metrics?.por_natureza || []).map((_, index) => (
                    <Cell key={`cell-nat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center">
            Análise estrutural de pagamentos
          </div>
        </div>

      </div>
    </div>
  );
}