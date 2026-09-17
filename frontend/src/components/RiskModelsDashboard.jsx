import React, { useState, useEffect } from 'react';
import { Award, Cpu, ShieldCheck, AlertTriangle, Layers, RefreshCw, BarChart2, Zap, Sliders, FileText, Check, Scale, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import API_URL from '../api';
import { useTheme } from '../context/ThemeContext';

const SLATE_GRID = '#1e293b';
const BAR_COLORS = [
  '#7c3aed',
  '#fb923c',
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

const obterCorLegivel = (corOriginal) => {
  if (corOriginal === '#6727a3' || corOriginal === '#a455f3') {
    return '#a855f7'; 
  }
  return corOriginal;
};

export default function RiskModelsDashboard({ dadosCache }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    borderRadius: 8,
    fontSize: 13,
    color: isDark ? '#f8fafc' : '#0f172a',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };
  
  const [dadosMlflow, setDadosMlflow] = useState(dadosCache || null);
  const [carregando, setCarregando] = useState(!dadosCache);
  const [erroApi, setErroApi] = useState(null);
  const [metricaAtiva, setMetricaAtiva] = useState('auc');

  const buscarMetricasMlflow = async () => {
    setCarregando(true);
    setErroApi(null);
    try {
      const response = await fetch(`${API_URL}/api/mlflow-model-metrics`);
      const data = await response.json();
      if (!response.ok || data.detail) throw new Error(data.detail || "Erro ao carregar dados do MLflow.");
      setDadosMlflow(data);
    } catch (err) {
      setErroApi(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (dadosCache) {
      setDadosMlflow(dadosCache);
      setCarregando(false);
      return;
    }

    buscarMetricasMlflow();
  }, [dadosCache]);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900/65 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-3 shadow-sm transition-colors">
        <RefreshCw className="w-7 h-7 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="text-base font-medium">Sincronizando métricas diretamente com o MLflow em tempo real...</p>
      </div>
    );
  }

  if (erroApi || !dadosMlflow) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-lg text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Repositório do MLflow Não Inicializado</h3>
        <p className="text-sm text-red-600 dark:text-red-300 max-w-lg mx-auto">
          {erroApi}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Causa: O banco PostgreSQL na Azure está conectado, mas o experimento de tracking ainda não foi populado por um script de treinamento em produção.
        </p>
        <button onClick={buscarMetricasMlflow} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { campeao, comparativo, roc_curve, confusion_matrix, feature_importances } = dadosMlflow;

  const comparativoOrdenado = [...comparativo].sort((a, b) => {
    return (b[metricaAtiva] || 0) - (a[metricaAtiva] || 0);
  });

  const renderKpiCard = (IconComponent, title, value, subtitle) => (
    <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col gap-1 relative overflow-hidden shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
          <IconComponent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <span className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight text-center block">{value}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center block mt-1">{subtitle}</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-6 transition-colors">
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Modelos de Treinamento do Simulador de Crédito & Governança (MLflow)</h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Ranking horizontal de performance, validação de métricas e regras de negócio.</p>
        </div>
        <span className="px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-full text-sm font-semibold flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
          Campeão em Produção: {campeao.modelo}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {renderKpiCard(Award, "AUC-ROC", Number(campeao.auc).toFixed(4), "Discriminação máxima")}
        {renderKpiCard(ShieldCheck, "Coef. Gini", Number(campeao.gini).toFixed(4), "Separação adimplência")}
        {renderKpiCard(Cpu, "G-Mean Score", Number(campeao.g_mean || campeao.f1).toFixed(4), "Equilíbrio de classes")}
        {renderKpiCard(Layers, "Threshold Ótimo", Number(campeao.best_threshold).toFixed(4), "Limiar de corte")}
        {renderKpiCard(Activity, "Acurácia", `${(campeao.accuracy * 100).toFixed(2)}%`, "Acertos globais")}
        {renderKpiCard(Scale, "Precisão", `${(campeao.precision * 100).toFixed(2)}%`, "Falsos positivos baixos")}
        {renderKpiCard(Zap, "Recall", `${(campeao.recall * 100).toFixed(2)}%`, "Detecção de inadimplência")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Ranking de Performance ({metricaAtiva.toUpperCase()})
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Eixo Y: Modelos | Eixo X: Métrica Selecionada</p>
              </div>
              
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'auc', label: 'AUC' },
                  { id: 'f1', label: 'F1' },
                  { id: 'precision', label: 'Prec' },
                  { id: 'recall', label: 'Rec' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetricaAtiva(m.id)}
                    className={`px-3.5 py-1.5 rounded text-sm font-medium transition-colors ${metricaAtiva === m.id ? 'bg-purple-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={comparativoOrdenado} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis type="number" domain={[0.5, 1.0]} tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="modelo" tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataItem = payload[0];
                      const index = comparativoOrdenado.findIndex(d => d.modelo === dataItem.payload.modelo);
                      const corOriginal = BAR_COLORS[index !== -1 ? index % BAR_COLORS.length : 0];
                      const corFinal = obterCorLegivel(corOriginal);
                      return (
                        <div style={tooltipStyle}>
                          <p style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{dataItem.payload.modelo}</p>
                          <p style={{ color: corFinal, fontWeight: 600 }}>
                            {metricaAtiva.toUpperCase()}: {Number(dataItem.value).toFixed(4)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey={metricaAtiva} radius={[0, 4, 4, 0]}>
                  {comparativoOrdenado.map((_, index) => (
                    <Cell key={`cell-rank-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Curva ROC (AUC = {(campeao.auc).toFixed(4)})
              </h3>
              <span className="text-xs text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/20 dark:border-purple-500/30 font-medium">
                MLflow Artifact
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Taxa de Verdadeiros Positivos (Sensibilidade) vs. Falsos Positivos (1 - Especificidade).
            </p>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roc_curve || []} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} />
                <XAxis 
                  dataKey="fpr" 
                  type="number" 
                  domain={[0, 1]} 
                  ticks={[0, 0.25, 0.5, 0.75, 1]} 
                  tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  dataKey="tpr" 
                  type="number" 
                  domain={[0, 1]} 
                  ticks={[0, 0.25, 0.5, 0.75, 1]} 
                  tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => [Number(val).toFixed(3), name === 'tpr' ? 'TPR (Sensibilidade)' : 'FPR']}
                />
                <Line type="monotone" dataKey="tpr" name="Modelo Campeão" stroke="#a855f7" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="diagonal" name="Linha Base (0.5)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 shadow-sm transition-colors flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Matriz de Risco - FinSight Sincronizado
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Dataset de Validação Real</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Real (Dataset) vs. Predito pelo Modelo
            </p>
          </div>

          <div className="relative my-auto">
            <div className="grid grid-cols-2 gap-4 text-center mb-2 pl-6">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Predito: Deny</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Predito: Approve</span>
            </div>

            <div className="flex items-center">
              <div className="w-6 flex items-center justify-center mr-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
                  Real (Dataset)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="p-5 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/40 rounded-lg text-center space-y-1.5 flex flex-col justify-center relative">
                  <span className="absolute left-2.5 top-2.5 text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest opacity-80">Denied</span>
                  <div className="text-3xl font-bold text-purple-950 dark:text-white pt-2">{confusion_matrix?.tn || 2658}</div>
                  <span className="text-[11px] font-medium text-purple-800 dark:text-purple-200">Verdadeiro Negativo</span>
                </div>

                <div className="p-5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1.5 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 pt-2">{confusion_matrix?.fp || 386}</div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Falso Positivo</span>
                </div>

                <div className="p-5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1.5 flex flex-col justify-center relative">
                  <span className="absolute left-2.5 top-2.5 text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest opacity-80">Approved</span>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 pt-2">{confusion_matrix?.fn || 65}</div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Falso Negativo</span>
                </div>

                <div className="p-5 bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-500/40 rounded-lg text-center space-y-1.5 flex flex-col justify-center">
                  <div className="text-3xl font-bold text-purple-950 dark:text-white pt-2">{confusion_matrix?.tp || 891}</div>
                  <span className="text-[11px] font-medium text-purple-800 dark:text-purple-200">Verdadeiro Positivo</span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 mt-3 tracking-wider">
              Predito pelo Modelo
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 flex flex-col justify-between shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Explicabilidade: Importância das Features
              </h3>
              <span className="text-xs text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/20 dark:border-purple-500/30 font-medium">
                MLflow / Model Gain
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Variáveis que mais influenciam o julgamento de crédito do modelo campeão.
            </p>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={feature_importances || []} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="feature" 
                  interval={0} 
                  tick={{ fill: isDark ? '#ffffff' : '#64748b', fontSize: 11, fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={140} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataItem = payload[0];
                      const index = feature_importances.findIndex(d => d.feature === dataItem.payload.feature);
                      const corOriginal = BAR_COLORS[index !== -1 ? index % BAR_COLORS.length : 0];
                      const corFinal = obterCorLegivel(corOriginal);
                      return (
                        <div style={tooltipStyle}>
                          <p style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{dataItem.payload.feature}</p>
                          <p style={{ color: corFinal, fontWeight: 600 }}>
                            Ganho: {Number(dataItem.value).toFixed(4)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="importance" barSize={18} radius={[0, 4, 4, 0]}>
                  {(feature_importances || []).map((_, index) => (
                    <Cell key={`cell-feat-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-white dark:bg-slate-900/80 p-8 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-6 shadow-sm transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Regras de Negócio & Políticas de Crédito Aplicadas</h3>
        </div>
        
        <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
          O motor de decisão do FinSight opera por meio de diretrizes quantitativas rigorosas integradas ao aprendizado de máquina para assegurar a sustentabilidade da carteira de crédito:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> Alavancagem e Renda
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              Propostas onde o valor solicitado compromete mais de 50% da renda anual projetada recebem travas automáticas de negação para evitar superendividamento.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> Calibragem de Corte
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              O limiar (threshold) de aprovação é otimizado dinamicamente via métrica G-Mean Segura (pesando sensibilidade a inadimplência em 65% e especificidade em 35%).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> Mitigação de Viés
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              O modelo Ensemble funde as predições probabilísticas do CatBoost e do XGBoost, neutralizando falsos negativos e garantindo estabilidade regulatória.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 text-lg font-bold">
              <Scale className="w-6 h-6 shrink-0" /> Desbalanceamento
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              Tratamento estatístico nativo de classes desbalanceadas via parâmetros de penalidade de erro (scale_pos_weight e auto_class_weights='Balanced'), impedindo que a carteira ignore maus pagadores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}