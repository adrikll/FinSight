import React, { useState } from 'react';

export default function SimuladorCredito() {
  const [formData, setFormData] = useState({
    name: '',
    requested_amount: '',
    renda_mensal: '',
    despesas_mensais: '',
    possui_emprestimos: 'Não',
    parcela_emprestimos_atual: '',
    modalidade: 'Empréstimos',
    porte: 'Mais de 3 a 5 salários mínimos',
    uf: 'CE'
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const valorSolicitado = parseFloat(formData.requested_amount) || 0;
    const despesasMensais = parseFloat(formData.despesas_mensais) || 0;
    const temEmprestimo = formData.possui_emprestimos === 'Sim';
    const parcelaAtual = parseFloat(formData.parcela_emprestimos_atual) || 0;
    const dividasTotaisMensais = despesasMensais + (temEmprestimo ? parcelaAtual : 0);

    // Conversão inteligente da faixa de porte selecionada para um valor de renda mensal aproximado
    let rendaMensalEstimada = 1412.0; // Padrão 1 salário mínimo
    if (formData.porte === 'Mais de 1 a 3 salários mínimos') rendaMensalEstimada = 3000.0;
    if (formData.porte === 'Mais de 3 a 5 salários mínimos') rendaMensalEstimada = 5000.0;
    if (formData.porte === 'Mais de 5 salários mínimos') rendaMensalEstimada = 8500.0;
    
    const numero_de_operacoes = temEmprestimo ? 2 : 0;
    const carteira_a_vencer = temEmprestimo ? parcelaAtual * 15 : 0.0; 
    const a_vencer_ate_90_dias = temEmprestimo ? parcelaAtual * 3 : 0.0;
    const a_vencer_de_91_ate_360_dias = carteira_a_vencer - a_vencer_ate_90_dias;

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          carteira_a_vencer: parseFloat(carteira_a_vencer),
          a_vencer_ate_90_dias: parseFloat(a_vencer_ate_90_dias),
          a_vencer_de_91_ate_360_dias: parseFloat(a_vencer_de_91_ate_360_dias > 0 ? a_vencer_de_91_ate_360_dias : 0),
          numero_de_operacoes: parseInt(numero_de_operacoes),
          requested_amount: valorSolicitado,
          dividas_mensais: dividasTotaisMensais,
          renda_informada: rendaMensalEstimada, // Enviando o valor numérico para o backend
          modalidade: formData.modalidade,
          porte: formData.porte,
          uf: formData.uf
        })
      });

      if (!response.ok) throw new Error('Erro na comunicação com a API.');

      const res = await response.json();
      setResultado(res);
    } catch (err) {
      setErro('Erro ao processar simulação. Verifique se a API FastAPI está ativa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">Simulador Inteligente de Crédito</h2>
        <p className="text-xs text-slate-400 mt-1">Responda perguntas simples. Nosso motor calcula os índices técnicos automaticamente nos bastidores.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Qual é o nome completo do cliente?</label>
          <input 
            type="text" 
            name="name" 
            required 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Digite o nome completo" 
            className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white" 
          />
        </div>

        {/* Valor Solicitado com R$ fixo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Quanto de crédito você está solicitando?</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-slate-400">R$</span>
            <input 
              type="number" 
              name="requested_amount" 
              required 
              value={formData.requested_amount} 
              onChange={handleChange} 
              placeholder="0,00" 
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white" 
            />
          </div>
        </div>

        {/* Porte da Renda / Enquadramento */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Qual a sua faixa de rendimento (Porte)?</label>
          <select 
            name="porte" 
            value={formData.porte} 
            onChange={handleChange} 
            className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white"
          >
            <option value="Até 1 salário mínimo">Até 1 salário mínimo</option>
            <option value="Mais de 1 a 3 salários mínimos">Mais de 1 a 3 salários mínimos</option>
            <option value="Mais de 3 a 5 salários mínimos">Mais de 3 a 5 salários mínimos</option>
            <option value="Mais de 5 salários mínimos">Mais de 5 salários mínimos</option>
          </select>
        </div>

        {/* Despesas Mensais com R$ fixo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Quais são suas despesas mensais fixas?</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-slate-400">R$</span>
            <input 
              type="number" 
              name="despesas_mensais" 
              required 
              value={formData.despesas_mensais} 
              onChange={handleChange} 
              placeholder="0,00" 
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white" 
            />
          </div>
        </div>

        {/* Possui empréstimos */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Você possui empréstimos ou financiamentos ativos?</label>
          <select 
            name="possui_emprestimos" 
            value={formData.possui_emprestimos} 
            onChange={handleChange} 
            className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white"
          >
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>
        </div>

        {/* Parcela Atual Condicional com R$ fixo */}
        {formData.possui_emprestimos === 'Sim' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Quanto você paga de parcela mensal nesses empréstimos?</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-slate-400">R$</span>
              <input 
                type="number" 
                name="parcela_emprestimos_atual" 
                required 
                value={formData.parcela_emprestimos_atual} 
                onChange={handleChange} 
                placeholder="0,00" 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white" 
              />
            </div>
          </div>
        )}

        {/* Estado (UF) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Qual o seu Estado (UF)?</label>
          <input 
            type="text" 
            name="uf" 
            required 
            maxLength={2}
            value={formData.uf} 
            onChange={handleChange} 
            placeholder="Ex: CE, SP, RJ" 
            className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white uppercase" 
          />
        </div>

        {/* Modalidade de Crédito Oficial */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Modalidade da Operação</label>
          <select 
            name="modalidade" 
            value={formData.modalidade} 
            onChange={handleChange} 
            className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm text-white"
          >
            <option value="Empréstimos">Empréstimos</option>
            <option value="Financiamentos">Financiamentos</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Adiantamento a Depositantes">Adiantamento a Depositantes</option>
          </select>
        </div>

        <div className="md:col-span-2 mt-4">
          <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl text-white transition-all shadow-lg shadow-purple-600/30">
            {loading ? 'Analisando Risco & Capacidade...' : 'Processar Decisão de Crédito'}
          </button>
        </div>
      </form>

      {erro && <div className="mt-4 p-3 bg-red-950/40 border border-red-700 text-red-300 rounded-xl text-xs">{erro}</div>}

      {resultado && resultado.evaluation && (
        <div className="mt-6 p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Resultado da Análise</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
              <p className={`text-base font-black ${resultado.evaluation.status === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}`}>
                {resultado.evaluation.status}
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rating de Risco</span>
              <p className="text-base font-black text-amber-400">{resultado.evaluation.risk_rating}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Limite Aprovado</span>
              <p className="text-base font-black text-white">R$ {resultado.evaluation.approved_limit.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Taxa de Juros</span>
              <p className="text-base font-black text-cyan-400">{resultado.evaluation.suggested_rate_annual}% a.a.</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800"><strong>Motivo:</strong> {resultado.evaluation.decision_reason}</p>
        </div>
      )}
    </div>
  );
}