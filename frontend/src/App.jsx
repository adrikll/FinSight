import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [formData, setFormData] = useState({
    loan_amnt: 5000,
    term: '36 Meses',
    annual_inc: 36000,
    monthly_debts: 500,
    home_ownership: 'Própria (OWN)',
    emp_length: '5 anos',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [c360Data, setC360Data] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [c360Loading, setC360Loading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/predict', {
        loan_amnt: parseFloat(formData.loan_amnt),
        term: formData.term,
        annual_inc: parseFloat(formData.annual_inc),
        monthly_debts: parseFloat(formData.monthly_debts),
        home_ownership: formData.home_ownership,
        emp_length: formData.emp_length,
        int_rate: 12.0,
        installment: 0.0,
        grade: "B",
        sub_grade: "B3",
        verification_status: "Verified",
        purpose: "debt_consolidation",
        dti: (parseFloat(formData.monthly_debts) / (parseFloat(formData.annual_inc) / 12)) * 100
      });

      setResult(response.data);
    } catch (err) {
      alert('Erro no processamento da solicitação de crédito.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer360 = async () => {
    setC360Loading(true);
    try {
      const res = await axios.get('http://localhost:8000/customer/1/360');
      setC360Data(res.data);
      setShowModal(true);
    } catch (err) {
      alert('Erro ao carregar os dados da visão Customer 360.');
    } finally {
      setC360Loading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-500">💳</span> FinSight
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomer360}
            disabled={c360Loading}
            className="bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 text-blue-300 text-xs px-4 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {c360Loading ? 'Carregando...' : '🔍 Visão Customer 360'}
          </button>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-3 py-1.5 rounded-full">
            ● Motor v1.0 • FastAPI + Stacking ML
          </span>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
              1. Condições do Empréstimo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor Solicitado ($)</label>
                <input
                  type="number"
                  name="loan_amnt"
                  value={formData.loan_amnt}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Prazo</label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="36 Meses">36 Meses</option>
                  <option value="60 Meses">60 Meses</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              2. Perfil Financeiro do Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Renda Anual ($)</label>
                <input
                  type="number"
                  name="annual_inc"
                  value={formData.annual_inc}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Dívidas/Gastos Mensais ($)</label>
                <input
                  type="number"
                  name="monthly_debts"
                  value={formData.monthly_debts}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Moradia</label>
                <select
                  name="home_ownership"
                  value={formData.home_ownership}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="Própria (OWN)">Própria (OWN)</option>
                  <option value="Alugada (RENT)">Alugada (RENT)</option>
                  <option value="Financiada (MORTGAGE)">Financiada (MORTGAGE)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tempo de Emprego</label>
                <select
                  name="emp_length"
                  value={formData.emp_length}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="< 1 ano">&lt; 1 ano</option>
                  <option value="1 ano">1 ano</option>
                  <option value="5 anos">5 anos</option>
                  <option value="10+ anos">10+ anos</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processando Decisão...' : 'Processar Decisão de Crédito'}
          </button>
        </form>

        {/* Painel de Resultados */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-sm font-semibold text-slate-300">Resultado da Análise</h2>
              {result && (
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    result.status === 'APROVADO'
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      : 'bg-rose-950 border-rose-800 text-rose-400'
                  }`}
                >
                  {result.status}
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Rating de Risco</span>
                    <span className="text-2xl font-bold text-white">{result.rating}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Prob. Default (PD)</span>
                    <span className="text-2xl font-bold text-blue-400">{result.pd_score}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Limite Aprovado</span>
                    <span className="text-2xl font-bold text-emerald-400">${result.approved_limit}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Taxa Sugerida</span>
                    <span className="text-2xl font-bold text-purple-400">{result.suggested_rate}% a.a.</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-4">
                  <span className="text-xs text-slate-400 block mb-1">Parecer do Motor</span>
                  <p className="text-xs text-slate-300">{result.decision_reason}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                Preencha os dados e clique em "Processar Decisão" para obter a inferência.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Customer 360 */}
      {showModal && c360Data && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              👤 Customer 360 — {c360Data.customer_profile.name}
            </h2>

            {/* Next Best Action Card */}
            <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-800 p-4 rounded-xl mb-6">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                🎯 Next Best Action ({c360Data.next_best_action.category})
              </span>
              <h3 className="text-lg font-bold text-white">{c360Data.next_best_action.action}</h3>
              <p className="text-xs text-slate-300 mt-1">{c360Data.next_best_action.description}</p>
            </div>

            {/* Perfil e Renda */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Renda Anual</span>
                <span className="text-lg font-semibold text-emerald-400">${c360Data.customer_profile.annual_inc}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Moradia / Experiência</span>
                <span className="text-sm font-medium text-slate-200">
                  {c360Data.customer_profile.home_ownership} • {c360Data.customer_profile.emp_length}
                </span>
              </div>
            </div>

            {/* Histórico Transacional (PostgreSQL) */}
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Histórico de Simulações (PostgreSQL)</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3">Valor</th>
                    <th className="p-3">PD</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {c360Data.credit_history.map((app) => (
                    <tr key={app.application_id} className="border-t border-slate-800">
                      <td className="p-3 font-medium">${app.requested_amount}</td>
                      <td className="p-3 text-blue-400">{app.pd_score}%</td>
                      <td className="p-3">{app.risk_rating}</td>
                      <td className="p-3 font-bold">{app.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Eventos Recentes (MongoDB) */}
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Logs de Comportamento (MongoDB NoSQL)</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2 max-h-36 overflow-y-auto">
              {c360Data.behavioral_events_log.map((evt, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-800/50 pb-1.5 last:border-0">
                  <span className="text-slate-400 font-mono">{evt.event_type}</span>
                  <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}