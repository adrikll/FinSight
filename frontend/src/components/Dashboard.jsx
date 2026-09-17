import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Percent, Landmark, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KpiCard from './KpiCard';
import MapaBrasil from './MapaBrasil';
import API_URL from '../api';
import { useTheme } from '../context/ThemeContext';

const SLATE_GRID = '#1e293b';
const DONUT_COLORS = ['#4b1383', '#38bdf8']; 
const BAR_COLORS = [
  '#7c3aed',
  '#f97316',
  '#06b6d4', 
  '#10b981', 
  '#c084fc', 
  '#38bdf8',
  '#2dd4bf', 
  '#9333ea',
  '#0ea5e9', 
  '#34d399', 
  '#a855f7', 
  '#22d3ee', 
  '#059669'  
];
const METRICAS_MAPA = [
  { key: 'carteira', label: 'Carteira' },
  { key: 'taxa_inadimplencia', label: 'Inadimplência' },
  { key: 'taxa_ativo_problematico', label: 'Ativos' },
];

export default function Dashboard({ dadosCache, macroCache }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 8,
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const [metrics, setMetrics] = useState(dadosCache || null);
  const [indicadores, setIndicadores] = useState(macroCache || null);
  const [loading, setLoading] = useState(!dadosCache || !macroCache);
  const [erroApi, setErroApi] = useState(false);
  const [metricaMapa, setMetricaMapa] = useState('carteira');
  const [ufSelecionada, setUfSelecionada] = useState('SP');

  useEffect(() => {
    if (dadosCache && macroCache) {
      setMetrics(dadosCache);
      setIndicadores(macroCache);
      if (dadosCache.mapa_uf && dadosCache.mapa_uf.length > 0 && !ufSelecionada) {
        setUfSelecionada(dadosCache.mapa_uf[0].uf);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const urlMetrics = `${API_URL}/api/dashboard-metrics`; 
    const urlMacro = `${API_URL}/api/macro/indicadores`;

    Promise.all([
      fetch(urlMetrics).then(r => r.json()),
      fetch(urlMacro).then(r => r.json()).catch(() => null),
    ])
      .then(([metricsData, macroData]) => {
        if (metricsData && !metricsData.error) {
          setMetrics(metricsData);
          if (metricsData.mapa_uf && metricsData.mapa_uf.length > 0 && !ufSelecionada) {
            setUfSelecionada(metricsData.mapa_uf[0].uf);
          }
        } else {
          setErroApi(true);
        }
        setIndicadores(macroData);
      })
      .catch(() => setErroApi(true))
      .finally(() => setLoading(false));
  }, [dadosCache, macroCache]);

  const formatarMoeda = (valor) => {
    if (valor === undefined || valor === null) return "R$ 0,0";
    if (Math.abs(valor) >= 1e12) return `R$ ${(valor / 1e12).toFixed(1)} tri`;
    if (Math.abs(valor) >= 1e9) return `R$ ${(valor / 1e9).toFixed(1)}B`;
    if (Math.abs(valor) >= 1e6) return `R$ ${(valor / 1e6).toFixed(1)}M`;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 });
  };

  const macroData = indicadores?.serie || [];
  const mapaUf = metrics?.mapa_uf || [];
  const ufDetalhe = ufSelecionada ? mapaUf.find(u => u.uf === ufSelecionada) : mapaUf[0];
  const pf = metrics?.risco_pf_pj?.PF;
  const pj = metrics?.risco_pf_pj?.PJ;
  const pjPfPie = pf && pj ? [{ name: 'Pessoa Física', value: pf.carteira }, { name: 'Pessoa Jurídica', value: pj.carteira }] : [];

  return (
    <div className="space-y-6 pb-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panorama Crédito</h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Fonte dos dados: Amostra de {metrics?.total_registros_agregados?.toLocaleString('pt-BR')} registros do SCR.data.
          </p>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
          <div className="text-left md:text-right">
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold inline-block">
              {loading ? 'Sincronizando' : erroApi ? 'Modo Offline' : 'Dados Reais Ativos'}
            </span>
            {metrics?.ultima_atualizacao && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Até {metrics.ultima_atualizacao}</p>
            )}
          </div>
        </div>
      </div>

      {erroApi && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          Não foi possível conectar ao endpoint `/api/dashboard-metrics`.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={TrendingUp} title="Carteira de Crédito" value={formatarMoeda(indicadores?.carteira_total?.valor_atual)}
                   delta={indicadores?.carteira_total?.delta} trend={indicadores?.carteira_total?.serie_recente} />
        <KpiCard icon={ShieldAlert} title="Inadimplência" value={`${indicadores?.inadimplencia_total?.valor_atual ?? '--'}%`}
                   delta={indicadores?.inadimplencia_total?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.inadimplencia_total?.serie_recente} />
        <KpiCard icon={Percent} title="Meta Selic" value={`${indicadores?.selic?.valor_atual !== undefined ? indicadores.selic.valor_atual.toFixed(2) : '--'}%`}
                   delta={indicadores?.selic?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.selic?.serie_recente} />
        <KpiCard icon={Landmark} title="Inflação (IPCA 12m)" value={`${indicadores?.ipca_12m?.valor_atual ?? '--'}%`}
                   delta={indicadores?.ipca_12m?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.ipca_12m?.serie_recente} />
        <KpiCard icon={Percent} title="Taxa Média de Juros" value={`${indicadores?.juros_medios?.valor_atual ?? '--'}% a.a.`}
                   delta={indicadores?.juros_medios?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.juros_medios?.serie_recente} />
        <KpiCard icon={Users} title="Taxa de Desocupação" value={`${indicadores?.desocupacao?.valor_atual ?? '--'}%`}
                   delta={indicadores?.desocupacao?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.desocupacao?.serie_recente} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Evolução do Crédito</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Carteira total (R$) vs Inadimplência (%)</p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={macroData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCarteiraTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4b1383" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4b1383" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={55} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip 
                  labelStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}
                  formatter={(value, name) => {
                    const cor = name === "Inadimplência Total %" ? '#fb923c' : '#a855f7';
                    const textoFormatado = name === "Inadimplência Total %" ? `${value}%` : formatarMoeda(value);
                    return [<span style={{ color: cor, fontWeight: 600 }}>{textoFormatado}</span>, <span style={{ color: cor }}>{name}</span>];
                  }}
                  contentStyle={tooltipStyle} 
                />
                <Area yAxisId="left" type="monotone" dataKey="carteira_total" name="Carteira Total" stroke="#4b1383" strokeWidth={2} fill="url(#colorCarteiraTotal)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="inadimplencia_total" name="Inadimplência Total %" stroke="#fb923c" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Série histórica consolidada
          </div>
        </div>

        {/* RANKING DE MODALIDADES*/}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Ranking de Modalidades</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Volume alocado por produto</p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={metrics?.distribuicao_modalidade || []} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
                <YAxis type="category" dataKey="modalidade" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={95} tickFormatter={(val) => val && val.length > 14 ? `${val.substring(0, 12)}...` : val} />
                <Tooltip 
                  cursor={false} 
                  labelStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}
                  formatter={(value, name, item) => {
                    const barraIndex = metrics?.distribuicao_modalidade?.findIndex(m => m.valor === item.value) ?? 0;
                    const corDinamica = BAR_COLORS[barraIndex % BAR_COLORS.length];
                    return [
                      <span style={{ color: corDinamica, fontWeight: 'bold' }}>{formatarMoeda(value)}</span>,
                      <span style={{ color: corDinamica }}>Valor</span>
                    ];
                  }}
                  contentStyle={tooltipStyle} 
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {(metrics?.distribuicao_modalidade || []).map((_, index) => (
                    <Cell key={`cell-mod-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Top modalidades ativas
          </div>
        </div>
        
        {/* PF VS PJ */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">PF vs PJ</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">Divisão ativa</p>
          </div>
          
          <div className="flex flex-col items-center justify-center my-auto py-1">
            <div className="w-full h-[110px]">
              <ResponsiveContainer width="100%" height={110}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={pjPfPie} dataKey="value" nameKey="name" innerRadius={30} outerRadius={50} paddingAngle={4}>
                    {pjPfPie.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip 
                    labelStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}
                    formatter={(value, name, item) => {
                      const fatiaIndex = pjPfPie.findIndex(p => p.name === item.name);
                      const corDinamica = DONUT_COLORS[fatiaIndex >= 0 ? fatiaIndex : 0];
                      const rotulo = name === 'Pessoa Física' ? 'Carteira PF' : 'Carteira PJ';
                      return [
                        <span style={{ color: corDinamica, fontWeight: 'bold' }}>{formatarMoeda(value)}</span>,
                        <span style={{ color: corDinamica }}>{rotulo}</span>
                      ];
                    }}
                    contentStyle={tooltipStyle} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2 mt-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4b1383] shrink-0"></span>
                  <span className="text-slate-900 dark:text-white font-bold truncate">Pessoa Física</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300"><span>Cart:</span> <span className="text-slate-900 dark:text-white font-bold">{formatarMoeda(pf?.carteira)}</span></div>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shrink-0"></span>
                  <span className="text-slate-900 dark:text-white font-bold truncate">Pessoa Jurídica</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300"><span>Cart:</span> <span className="text-slate-900 dark:text-white font-bold">{formatarMoeda(pj?.carteira)}</span></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-2">
            Segmentação
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Ativos Problemáticos (PF vs PJ)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Evolução da taxa de ativos problemáticos (%)</p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={indicadores?.ativos_problematicos_segmentado || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip 
                  labelStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}
                  formatter={(value, name) => {
                    const cor = name === "Pessoa Jurídica (PJ)" ? '#38bdf8' : '#a855f7';
                    return [<span style={{ color: cor, fontWeight: 600 }}>{value}%</span>, <span style={{ color: cor }}>{name}</span>];
                  }}
                  contentStyle={tooltipStyle} 
                />
                <Line type="monotone" dataKey="PF" name="Pessoa Física (PF)" stroke="#9045db" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="PJ" name="Pessoa Jurídica (PJ)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Comparativo de risco por segmento
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">Mapa de Exposição por UF</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Clique para fixar o estado</p>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-950/80 rounded-lg p-1 border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
              {METRICAS_MAPA.map(m => (
                <button key={m.key} onClick={() => setMetricaMapa(m.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${metricaMapa === m.key ? 'bg-purple-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mapaUf.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto">
              <div className="md:col-span-7 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-lg p-2 border border-slate-200 dark:border-slate-800/80 h-[220px]">
                <MapaBrasil 
                  mapaUf={mapaUf}
                  metricaMapa={metricaMapa}
                  ufSelecionada={ufSelecionada}
                  onSelecionarUf={setUfSelecionada}
                />
              </div>

              <div className="md:col-span-5 flex flex-col justify-center">
                {ufDetalhe ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-2 text-xs shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/60 text-xs">{ufDetalhe.uf}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-300">Ativo</span>
                      </div>
                      <button 
                        onClick={() => setUfSelecionada(null)} 
                        className="text-[11px] text-slate-600 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 px-2 py-0.5 rounded transition-colors"
                      >
                        ✕ Limpar
                      </button>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Carteira:</span> <b className="text-slate-900 dark:text-white font-semibold">{formatarMoeda(ufDetalhe.carteira)}</b></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Inadimplência:</span> <b className="text-slate-900 dark:text-white font-semibold">{ufDetalhe.taxa_inadimplencia}%</b></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Ativos Prob.:</span> <b className="text-slate-900 dark:text-white font-semibold">{ufDetalhe.taxa_ativo_problematico}%</b></div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-1 text-xs h-[110px]">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Nenhum estado selecionado.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center py-16">Nenhum dado de UF carregado.</p>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Distribuição geográfica regional
          </div>
        </div>
      </div>
    </div>
  );
}