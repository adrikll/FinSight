import React, { useState, useEffect } from 'react';

export default function SimuladorCenarios() {
  const [baseline, setBaseline] = useState(null);
  const [percentual, setPercentual] = useState(10);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/portfolio-baseline')
      .then(res => res.json())
      .then(data => setBaseline(data))
      .catch(() => setErro('Não foi possível carregar a base histórica.'));
  }, []);

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return "R$ 0,00";
    if (Math.abs(valor) >= 1e9) return `R$ ${(valor / 1e9).toFixed(2)}B`;
    if (Math.abs(valor) >= 1e6) return `R$ ${(valor / 1e6).toFixed(2)}M`;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSimular = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/scenario/crescimento-carteira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentual_crescimento: parseFloat(percentual) || 0 })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResultado(data);
    } catch (err) {
      setErro(err.message || 'Erro ao simular cenário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Simulador de Cenários — Crescimento de Carteira</h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulação agregada sobre a base histórica do BCB (SCR.data). Não representa cliente individual.
        </p>
      </div>

      {baseline && !baseline.error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Carteira Ativa Base</span>
            <p className="text-lg font-black text-white">{formatarMoeda(baseline.carteira_ativa_total)}</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Inadimplência Base</span>
            <p className="text-lg font-black text-white">{formatarMoeda(baseline.carteira_inadimplida_total)}</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Taxa de Inadimplência Base</span>
            <p className="text-lg font-black text-amber-400">{baseline.taxa_inadimplencia_base}%</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Percentual de crescimento (negativo para redução)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.5"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className="w-32 p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white"
          />
          <span className="text-sm text-slate-400">%</span>
          <button
            onClick={handleSimular}
            disabled={loading}
            className="ml-auto py-2.5 px-6 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl text-white transition-all shadow-lg shadow-purple-600/30"
          >
            {loading ? 'Simulando...' : 'Simular Cenário'}
          </button>
        </div>
      </div>

      {erro && <div className="p-3 bg-red-950/40 border border-red-700 text-red-300 rounded-xl text-xs">{erro}</div>}

      {resultado && (
        <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-purple-400">{resultado.tipo_cenario}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Carteira Projetada</span>
              <p className="text-base font-black text-white">{formatarMoeda(resultado.projetado.carteira_ativa)}</p>
              <p className="text-xs text-emerald-400 mt-1">
                {resultado.variacao_vs_base.carteira_ativa_percentual > 0 ? '+' : ''}
                {resultado.variacao_vs_base.carteira_ativa_percentual}% vs base
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Inadimplência Projetada</span>
              <p className="text-base font-black text-white">{formatarMoeda(resultado.projetado.carteira_inadimplida)}</p>
              <p className="text-xs text-slate-400 mt-1">Taxa mantida em {resultado.projetado.taxa_inadimplencia}%</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Premissas</span>
            <p className="text-xs text-slate-300 italic mt-1">{resultado.premissas.hipotese}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Método</span>
            <p className="text-xs text-slate-300 mt-1">{resultado.metodo}</p>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold">Limitações</span>
            <ul className="text-xs text-slate-400 mt-1 list-disc list-inside space-y-1">
              {resultado.limitacoes.map((lim, i) => <li key={i}>{lim}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}