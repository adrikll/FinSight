import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Percent, Landmark, AlertOctagon, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KpiCard from './KpiCard';
import MapaBrasil from './MapaBrasil'; // <-- 1. Importando o componente do Mapa

const SLATE_GRID = '#1e293b';
const DONUT_COLORS = ['#4b1383', '#38bdf8']; // PF (#4b1383) e PJ (#38bdf8) alinhados com as legendas
const METRICAS_MAPA = [
  { key: 'carteira', label: 'Carteira' },
  { key: 'taxa_inadimplencia', label: 'Inadimplência' },
  { key: 'taxa_ativo_problematico', label: 'Ativos Problemáticos' },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroApi, setErroApi] = useState(false);
  const [metricaMapa, setMetricaMapa] = useState('carteira');
  const [ufSelecionada, setUfSelecionada] = useState('SP');

  useEffect(() => {
    setLoading(true);
    const urlMetrics = 'http://127.0.0.1:8000/api/dashboard-metrics';
    const urlMacro = 'http://127.0.0.1:8000/api/macro/indicadores';

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
  }, []);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-lg border border-slate-800/80">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Panorama Nacional de Crédito</h2>
          <p className="text-sm text-slate-400 mt-1">
            Fonte dos dados: Amostra de {metrics?.total_registros_agregados?.toLocaleString('pt-BR')} registros do SCR.data (Banco Central do Brasil).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium block">
              {loading ? 'Sincronizando' : erroApi ? 'Modo Offline' : 'Dados Reais Ativos'}
            </span>
            {metrics?.ultima_atualizacao && (
              <p className="text-[11px] text-slate-500 mt-1">Dado até {metrics.ultima_atualizacao} · carregado em {metrics.carregado_em}</p>
            )}
          </div>
        </div>
      </div>

      {erroApi && (
        <div className="p-4 bg-amber-950/40 border border-amber-700/50 text-amber-300 rounded-lg text-xs">
          Não foi possível conectar ao endpoint `/api/dashboard-metrics`.
        </div>
      )}

      {/* Cartões Macro */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={TrendingUp} title="Carteira de Crédito" value={formatarMoeda(indicadores?.carteira_total?.valor_atual)}
                 delta={indicadores?.carteira_total?.delta} trend={indicadores?.carteira_total?.serie_recente} />
        <KpiCard icon={ShieldAlert} title="Inadimplência" value={`${indicadores?.inadimplencia_total?.valor_atual ?? '--'}%`}
                 delta={indicadores?.inadimplencia_total?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.inadimplencia_total?.serie_recente} />
        <KpiCard icon={Percent} title="Meta Selic" value={`${indicadores?.selic?.valor_atual !== undefined ? indicadores.selic.valor_atual.toFixed(2) : '--'}%`}
                 delta={indicadores?.selic?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.selic?.serie_recente} />
        <KpiCard icon={Landmark} title="Inflação (IPCA 12m)" value={`${indicadores?.ipca_12m?.valor_atual ?? '--'}%`}
                 delta={indicadores?.ipca_12m?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.ipca_12m?.serie_recente} />
        <KpiCard icon={AlertOctagon} title="Ativos Problemáticos" value={`${metrics?.ativo_problematico_taxa ?? '--'}%`}
                 delta={metrics?.ativo_problematico_delta} deltaInvertido trend={metrics?.ativo_problematico_serie} />
        <KpiCard icon={Users} title="Taxa de Desocupação" value={`${indicadores?.desocupacao?.valor_atual ?? '--'}%`}
                 delta={indicadores?.desocupacao?.delta} deltaSufixo=" p.p." deltaInvertido trend={indicadores?.desocupacao?.serie_recente} />
      </div>

      {/* Linha 1: Evolução do Crédito | PF x PJ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80">
          <h3 className="text-sm font-medium text-white mb-1">Evolução do Crédito e da Inadimplência</h3>
          <p className="text-xs text-slate-500 mb-4">Carteira total (R$) vs Inadimplência total (%)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={macroData}>
              <defs>
                <linearGradient id="colorCarteiraTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4b1383" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4b1383" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} />
              <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="carteira_total" name="Carteira Total" stroke="#4b1383" strokeWidth={2} fillOpacity={1} fill="url(#colorCarteiraTotal)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="inadimplencia_total" name="Inadimplência Total %" stroke="#fb923c" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Pessoa Física vs Pessoa Jurídica</h3>
            <p className="text-xs text-slate-500 mb-4">Carteira ativa e indicadores de risco por tipo de cliente</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[210px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie data={pjPfPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {pjPfPie.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={formatarMoeda} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4b1383]"></span>
                  <span className="text-white font-semibold">Pessoa Física</span>
                </div>
                <div className="flex justify-between text-slate-400"><span>Carteira:</span> <span className="text-white font-medium">{formatarMoeda(pf?.carteira)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Inadimplência:</span> <span className="text-white font-medium">{pf?.taxa_inadimplencia}%</span></div>
                <div className="flex justify-between text-slate-400"><span>Ativo Problemático:</span> <span className="text-white font-medium">{pf?.taxa_ativo_problematico}%</span></div>
              </div>

              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
                  <span className="text-white font-semibold">Pessoa Jurídica</span>
                </div>
                <div className="flex justify-between text-slate-400"><span>Carteira:</span> <span className="text-white font-medium">{formatarMoeda(pj?.carteira)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Inadimplência:</span> <span className="text-white font-medium">{pj?.taxa_inadimplencia}%</span></div>
                <div className="flex justify-between text-slate-400"><span>Ativo Problemático:</span> <span className="text-white font-medium">{pj?.taxa_ativo_problematico}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha 2: Inadimplência PF | Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80">
          <h3 className="text-sm font-medium text-white mb-1">Evolução da Inadimplência PF</h3>
          <p className="text-xs text-slate-500 mb-4">Série oficial SGS/BCB</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={macroData}>
              <defs>
                <linearGradient id="colorInadPF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4b1383" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#4b1383" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="inadimplencia_pf" name="Inadimplência PF %" stroke="#4b1383" strokeWidth={2} fillOpacity={1} fill="url(#colorInadPF)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Mapa de Exposição por UF</h3>
              <p className="text-xs text-slate-500">Passe o cursor para identificar ou clique para fixar o detalhe</p>
            </div>
            <div className="flex gap-1 bg-slate-950/60 rounded-lg p-1">
              {METRICAS_MAPA.map(m => (
                <button key={m.key} onClick={() => setMetricaMapa(m.key)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${metricaMapa === m.key ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mapaUf.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Mapa com espaço ampliado (Esquerda) */}
              <div className="lg:col-span-7 flex items-center justify-center bg-slate-950/30 rounded-lg p-2 border border-slate-800/40">
                <MapaBrasil 
                  mapaUf={mapaUf}
                  metricaMapa={metricaMapa}
                  ufSelecionada={ufSelecionada}
                  onSelecionarUf={setUfSelecionada}
                />
              </div>

              {/* Caixa de detalhes mais compacta (Direita) */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                {ufDetalhe && (
                  <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-col gap-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-white font-bold text-sm bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">{ufDetalhe.uf}</span>
                      <span className="text-[10px] text-slate-500">Estado Selecionado</span>
                    </div>
                    <div className="flex justify-between text-slate-400"><span>Carteira:</span> <b className="text-white">{formatarMoeda(ufDetalhe.carteira)}</b></div>
                    <div className="flex justify-between text-slate-400"><span>Inadimplência:</span> <b className="text-white">{ufDetalhe.taxa_inadimplencia}%</b></div>
                    <div className="flex justify-between text-slate-400"><span>Ativos Problemáticos:</span> <b className="text-white">{ufDetalhe.taxa_ativo_problematico}%</b></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-16">Nenhum dado de UF carregado.</p>
          )}
        </div>
      </div>
    </div>
  );
}