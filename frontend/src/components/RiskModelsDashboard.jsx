import React, { useState, useEffect } from 'react';
import { Award, Cpu, ShieldCheck, CheckCircle2, AlertTriangle, Layers, RefreshCw, BarChart2, Zap, Sliders, FileText, Check, Scale } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const SLATE_GRID = '#1e293b';

export default function RiskModelsDashboard() {
  const [dadosMlflow, setDadosMlflow] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState(null);
  const [metricaAtiva, setMetricaAtiva] = useState('auc');

  const buscarMetricasMlflow = async () => {
    setCarregando(true);
    setErroApi(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/mlflow-model-metrics');
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
    buscarMetricasMlflow();
  }, []);

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
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Falha ao Conectar com o Repositório do MLflow</h3>
        <p className="text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">{erroApi}</p>
        <button onClick={buscarMetricasMlflow} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { campeao, comparativo } = dadosMlflow;

  const comparativoOrdenado = [...comparativo].sort((a, b) => {
    return (b[metricaAtiva] || 0) - (a[metricaAtiva] || 0);
  });

  return (
    <div className="space-y-6 pb-6 transition-colors">
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Modelos de Treinamento do Simulador de Crédito & Governança (MLflow)</h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Ranking horizontal de performance, validação de métricas e regras de negócio.</p>
        </div>
        <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-semibold flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          Campeão em Produção: {campeao.modelo}
        </span>
      </div>

      {/* Cartões de Indicadores Chave do Campeão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">AUC-ROC (Validação)</span>
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{(campeao.auc).toFixed(4)}</div>
          <span className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Poder de discriminação máximo</span>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Coeficiente Gini</span>
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{(campeao.gini).toFixed(4)}</div>
          <span className="text-sm text-slate-600 dark:text-slate-300 mt-2">Separação de adimplência</span>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">G-Mean / F1-Score</span>
            <Cpu className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{(campeao.g_mean || campeao.f1).toFixed(4)}</div>
          <span className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Equilíbrio rigoroso de classes</span>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Threshold Ótimo</span>
            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{(campeao.best_threshold).toFixed(4)}</div>
          <span className="text-sm text-slate-600 dark:text-slate-300 mt-2">Limiar de corte calibrado</span>
        </div>
      </div>

      {/* Grid Principal: Esquerda (Ranking Horizontal) | Direita (Painel de Informações e Governança) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Gráfico de Ranking Horizontal */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 flex flex-col justify-between shadow-sm transition-colors">
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
                <XAxis type="number" domain={[0.5, 1.0]} tick={{ fill: '#cbd5e1', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="modelo" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} width={155} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                  formatter={(val) => [Number(val).toFixed(4), metricaAtiva.toUpperCase()]}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13, color: '#f8fafc', padding: '12px 16px' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
                />
                <Bar dataKey={metricaAtiva} radius={[0, 4, 4, 0]}>
                  {comparativoOrdenado.map((entry, index) => (
                    <Cell key={`cell-rank-${index}`} fill={entry.status === 'Produção' ? '#a855f7' : '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lado Direito: Informações e Governança do Modelo Campeão */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 p-6 rounded-lg border border-slate-200 dark:border-slate-800/85 flex flex-col justify-between space-y-4 shadow-sm transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Governança & Destaque do Campeão
              </h3>
              <span className="text-xs text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-1 rounded border border-purple-500/20 dark:border-purple-500/30 font-medium">
                MLflow Ativo
              </span>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              O modelo em produção atual é o <b>{campeao.modelo}</b>, validado via engenharia de features avançada e otimização de limiar de segurança (G-Mean).
            </p>

            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Estratégia de Ensemble</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">55% CatBoost + 45% XGBoost</span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Minimização de Risco (G-Mean)</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">Threshold Ótimo: {campeao.best_threshold?.toFixed(4)}</span>
                </div>
                <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Fator de Alavancagem Prioritário</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">Comprometimento de Renda</span>
                </div>
                <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Seção Inferior: Regras de Negócio e Políticas de Crédito do Motor*/}
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
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> 1. Alavancagem e Renda
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              Propostas onde o valor solicitado compromete mais de 50% da renda anual projetada recebem travas automáticas de negação para evitar superendividamento.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> 2. Calibragem de Corte
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              O limiar (threshold) de aprovação é otimizado dinamicamente via métrica G-Mean Segura (pesando sensibilidade a inadimplência em 65% e especificidade em 35%).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 text-lg font-bold">
              <Check className="w-6 h-6 shrink-0" /> 3. Mitigação de Viés
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              O modelo Ensemble funde as predições probabilísticas do CatBoost e do XGBoost, neutralizando falsos negativos e garantindo estabilidade regulatória.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-lg font-bold">
              <Scale className="w-6 h-6 shrink-0" /> 4. Desbalanceamento
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