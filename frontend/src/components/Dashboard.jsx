import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Percent, Landmark, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KpiCard from './KpiCard';
import MapaBrasil from './MapaBrasil';
import API_URL from '../api';

const SLATE_GRID = '#1e293b';
const DONUT_COLORS = ['#4b1383', '#38bdf8']; 
const BAR_COLORS = ['#4b1383', '#38bdf8', '#8b5cf6', '#06b6d4', '#6366f1'];
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
    <div className="space-y-6 pb-6 transition-colors">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panorama Nacional de Crédito</h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
            Fonte dos dados: Amostra de {metrics?.total_registros_agregados?.toLocaleString('pt-BR')} registros do SCR.data (Banco Central do Brasil).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-semibold block">
              {loading ? 'Sincronizando' : erroApi ? 'Modo Offline' : 'Dados Reais Ativos'}
            </span>
            {metrics?.ultima_atualizacao && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dado até {metrics.ultima_atualizacao} · carregado em {metrics.carregado_em}</p>
            )}
          </div>
        </div>
      </div>

      {erroApi && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 rounded-lg text-sm">
          Não foi possível conectar ao endpoint `/api/dashboard-metrics`.
        </div>
      )}

      {/* Cartões Macro */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
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

      {/* Linha Superior: 3 Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução do Crédito */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Evolução do Crédito</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Carteira total (R$) vs Inadimplência (%)</p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={macroData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCarteiraTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4b1383" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4b1383" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatarMoeda} width={75} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip 
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}
                  formatter={(value, name) => [
                    name === "Inadimplência Total %" ? `${value}%` : formatarMoeda(value),
                    name
                  ]}
                  itemStyle={{ color: '#c084fc', fontSize: '13px', padding: 0 }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f8fafc' }} 
                />
                <Area yAxisId="left" type="monotone" dataKey="carteira_total" name="Carteira Total" stroke="#4b1383" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarteiraTotal)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="inadimplencia_total" name="Inadimplência Total %" stroke="#fb923c" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Série histórica consolidada
          </div>
        </div>

        {/* Gráfico 2: Ranking de Modalidades */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Ranking de Modalidades</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Volume alocado por produto</p>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart 
                layout="vertical"
                data={metrics?.distribuicao_modalidade || []}
                margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={formatarMoeda} 
                />
                <YAxis 
                  type="category" 
                  dataKey="modalidade" 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={110}
                  tickFormatter={(val) => val && val.length > 16 ? `${val.substring(0, 14)}...` : val}
                />
                <Tooltip 
                  cursor={false} 
                  formatter={(value) => [formatarMoeda(value), "Valor"]}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}
                  itemStyle={{ color: '#c084fc', fontSize: '13px', padding: 0 }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f8fafc' }} 
                />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {
                    (metrics?.distribuicao_modalidade || []).map((_, index) => (
                      <Cell key={`cell-mod-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Top modalidades ativas
          </div>
        </div>
        
        {/* Gráfico 3: Perfil PF vs PJ */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Perfil PF vs PJ</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Divisão ativa</p>
          </div>
          
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="w-full h-[130px]">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={pjPfPie} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={4}>
                    {pjPfPie.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      formatarMoeda(value), 
                      name === 'Pessoa Física' ? 'Carteira PF' : 'Carteira PJ'
                    ]}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}
                    itemStyle={{ color: '#c084fc', fontSize: '13px', padding: 0 }}
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f8fafc' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2.5 mt-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#4b1383] flex-shrink-0"></span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm truncate">Pessoa Física</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-xs py-0.5"><span>Cart.:</span> <span className="text-slate-900 dark:text-white font-bold">{formatarMoeda(pf?.carteira)}</span></div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-xs py-0.5"><span>Inad.:</span> <span className="text-slate-900 dark:text-white font-bold">{pf?.taxa_inadimplencia}%</span></div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#38bdf8] flex-shrink-0"></span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm truncate">Pessoa Jurídica</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-xs py-0.5"><span>Cart.:</span> <span className="text-slate-900 dark:text-white font-bold">{formatarMoeda(pj?.carteira)}</span></div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 text-xs py-0.5"><span>Inad.:</span> <span className="text-slate-900 dark:text-white font-bold">{pj?.taxa_inadimplencia}%</span></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center font-medium mt-2">
            Segmentação
          </div>
        </div>
      </div>

      {/* Linha Inferior: 2 Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 4: Ativos Problemáticos Segmentados */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Ativos Problemáticos Segmentados (PF vs PJ)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Evolução da taxa de ativos problemáticos (%) por tipo de cliente</p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={indicadores?.ativos_problematicos_segmentado || []} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} vertical={false} />
                <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Taxa"]}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}
                  itemStyle={{ color: '#c084fc', fontSize: '13px', padding: 0 }}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f8fafc' }} 
                />
                <Line type="monotone" dataKey="PF" name="Pessoa Física (PF)" stroke="#4b1383" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="PJ" name="Pessoa Jurídica (PJ)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Comparativo de risco por segmento
          </div>
        </div>

        {/* Gráfico 5: Mapa Geográfico */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mapa de Exposição por UF</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Passe o cursor ou clique para fixar o estado</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800">
              {METRICAS_MAPA.map(m => (
                <button key={m.key} onClick={() => setMetricaMapa(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${metricaMapa === m.key ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mapaUf.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto">
              <div className="md:col-span-8 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800/80 h-[260px]">
                <MapaBrasil 
                  mapaUf={mapaUf}
                  metricaMapa={metricaMapa}
                  ufSelecionada={ufSelecionada}
                  onSelecionarUf={setUfSelecionada}
                />
              </div>

              <div className="md:col-span-4 flex flex-col justify-center">
                {ufDetalhe ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-3 text-sm shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold bg-purple-900/50 px-2.5 py-0.5 rounded border border-purple-700/60">{ufDetalhe.uf}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">Selecionado</span>
                      </div>
                      <button 
                        onClick={() => setUfSelecionada(null)} 
                        className="text-xs text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                        title="Limpar seleção"
                      >
                        ✕ Limpar
                      </button>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Carteira:</span> <b className="text-slate-900 dark:text-white font-semibold">{formatarMoeda(ufDetalhe.carteira)}</b></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Inadimplência:</span> <b className="text-slate-900 dark:text-white font-semibold">{ufDetalhe.taxa_inadimplencia}%</b></div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Ativos Prob.:</span> <b className="text-slate-900 dark:text-white font-semibold">{ufDetalhe.taxa_ativo_problematico}%</b></div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-xs h-[140px]">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">Nenhum estado selecionado no momento.</p>
                    <span className="text-slate-500 dark:text-slate-300">Clique em um estado do mapa para ver os detalhes.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center py-16">Nenhum dado de UF carregado.</p>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 text-center font-medium mt-4">
            Distribuição geográfica regional
          </div>
        </div>
      </div>
    </div>
  );
}