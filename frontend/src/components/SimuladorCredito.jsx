import React, { useState } from 'react';

export default function SimuladorCredito() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    annualincome: '',
    monthlyincome: '',
    employmentstatus: '',
    educationlevel: '',
    experience: '',
    loanamount: '',
    loanduration: '',
    maritalstatus: '',
    numberofdependents: '',
    homeownershipstatus: '',
    monthlydebtpayments: '',
    creditcardutilizationrate: '',
    savingsaccountbalance: '',
    checkingaccountbalance: '',
    totalassets: '',
    totalliabilities: '',
    jobtenure: '',
    networth: '',
    loanpurpose: '',
    uf: ''
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const formatarMoedaInput = (valor) => {
    let apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return '';
    let numeroDecimal = (parseFloat(apenasNumeros) / 100).toFixed(2);
    let partes = numeroDecimal.split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${partes[0]},${partes[1]}`;
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const valorFormatado = formatarMoedaInput(value);
    setFormData({ ...formData, [name]: valorFormatado });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const parseMoedaToFloat = (valorStr) => {
    if (!valorStr) return 0.0;
    const limpo = valorStr.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0.0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age) || 0,
          annualincome: parseMoedaToFloat(formData.annualincome),
          monthlyincome: parseMoedaToFloat(formData.monthlyincome),
          employmentstatus: formData.employmentstatus,
          educationlevel: formData.educationlevel,
          experience: parseFloat(formData.experience) || 0,
          loanamount: parseMoedaToFloat(formData.loanamount),
          loanduration: parseInt(formData.loanduration) || 12,
          maritalstatus: formData.maritalstatus,
          numberofdependents: parseInt(formData.numberofdependents) || 0,
          homeownershipstatus: formData.homeownershipstatus,
          monthlydebtpayments: parseMoedaToFloat(formData.monthlydebtpayments),
          creditcardutilizationrate: parseFloat(formData.creditcardutilizationrate) || 0,
          savingsaccountbalance: parseMoedaToFloat(formData.savingsaccountbalance),
          checkingaccountbalance: parseMoedaToFloat(formData.checkingaccountbalance),
          totalassets: parseMoedaToFloat(formData.totalassets),
          totalliabilities: parseMoedaToFloat(formData.totalliabilities),
          jobtenure: parseFloat(formData.jobtenure) || 0,
          networth: parseMoedaToFloat(formData.networth),
          loanpurpose: formData.loanpurpose,
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
    <div className="space-y-10 w-full max-w-full px-2 pb-16 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Cabeçalho*/}
      <div className="bg-white dark:bg-slate-900/60 p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Simulador Inteligente de Crédito</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mt-3">
          Preencha os campos abaixo para realizar a análise de risco baseada em seu perfil socioeconômico e capacidade financeira.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* BLOCO 1: Informações Pessoais & Profissionais */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-6 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">Informações Pessoais e Profissionais</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Dados cadastrais básicos do solicitante.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Nome Completo do Cliente</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex: João da Silva" 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual a sua idade?</label>
                <input 
                  type="number" 
                  name="age" 
                  required 
                  value={formData.age} 
                  onChange={handleChange} 
                  placeholder="Ex: 30" 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual a sua Situação Profissional?</label>
                <select 
                  name="employmentstatus" 
                  value={formData.employmentstatus} 
                  onChange={handleChange} 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="employed">Empregado (CLT)</option>
                  <option value="self-employed">Autônomo / Empresário</option>
                  <option value="unemployed">Desempregado</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual o seu Estado (UF)?</label>
                <input 
                  type="text" 
                  name="uf" 
                  maxLength={2} 
                  required 
                  value={formData.uf} 
                  onChange={handleChange} 
                  placeholder="Ex: SP" 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg uppercase focus:border-purple-500 focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Renda, Dívidas e Solicitação de Crédito */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-6 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">Renda, Dívidas e Solicitação de Crédito</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Detalhes sobre os valores pretendidos e fluxo mensal de caixa.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual o valor da sua Renda Mensal?</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="monthlyincome" 
                    required 
                    value={formData.monthlyincome} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 7.500,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual o valor da sua Renda Anual estimada?</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="annualincome" 
                    required 
                    value={formData.annualincome} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 90.000,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Quanto de empréstimo você deseja solicitar?</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="loanamount" 
                    required 
                    value={formData.loanamount} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 20.000,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Quanto você paga de dívidas/empréstimos por mês?</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="monthlydebtpayments" 
                    required 
                    value={formData.monthlydebtpayments} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 1.200,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Qual a finalidade deste empréstimo?</label>
              <select 
                name="loanpurpose" 
                value={formData.loanpurpose} 
                onChange={handleChange} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="debt consolidation">Quitação de Dívidas</option>
                <option value="home improvement">Reforma Residencial</option>
                <option value="business">Investimento no Negócio</option>
                <option value="personal">Pessoal / Geral</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Patrimônio e Passivos */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-6 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">Patrimônio e Passivos</h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Composição de bens, passivos e garantias patrimoniais.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Valor Total dos Seus Bens</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="totalassets" 
                    required 
                    value={formData.totalassets} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 50.000,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Valor Total de Outras Dívidas Ativas</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="totalliabilities" 
                    required 
                    value={formData.totalliabilities} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 10.000,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-200 mb-2">Patrimônio Líquido Estimado</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-base font-semibold text-slate-500 dark:text-slate-400">R$</span>
                  <input 
                    type="text" 
                    name="networth" 
                    required 
                    value={formData.networth} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 40.000,00"
                    className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-lg focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Envio*/}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-6 bg-purple-600 hover:bg-purple-500 font-bold rounded-2xl text-white transition-all shadow-2xl shadow-purple-900/40 text-xl cursor-pointer"
          >
            {loading ? 'Processando Análise com IA...' : 'Simular Crédito com IA'}
          </button>
        </div>
      </form>

      {erro && <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-2xl text-base">{erro}</div>}

      {/* Resultados*/}
      {resultado && resultado.evaluation && (
        <div className="bg-white dark:bg-slate-900/80 p-8 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-8 shadow-2xl transition-colors">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Resultado Detalhado da Análise de Crédito</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Decisão</span>
              <p className={`text-2xl font-bold ${resultado.evaluation.status === 'APROVADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {resultado.evaluation.status}
              </p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Nível de Risco</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{resultado.evaluation.risk_rating}</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Score de Probabilidade</span>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{resultado.evaluation.approval_probability}%</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Limite Disponível</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">R$ {resultado.evaluation.approved_limit.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-base text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
            <strong className="text-slate-900 dark:text-white font-bold block text-lg mb-2">Análise Explicativa do Perfil:</strong> 
            {resultado.evaluation.decision_reason}
          </div>

          {resultado.fraud_analysis && (
            <div className={`p-8 rounded-2xl border text-base ${resultado.fraud_analysis.is_suspicious ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/60 text-red-800 dark:text-red-200' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'}`}>
              <div className="font-bold text-lg mb-2">
                {resultado.fraud_analysis.is_suspicious ? '⚠️ Alerta de Anomalia / Fraude Detectado' : '🛡️ Triagem de Segurança: Aprovado sem Suspeitas'}
              </div>
              {resultado.fraud_analysis.flags.length > 0 ? (
                <ul className="list-disc list-inside mt-2 space-y-1 text-base">
                  {resultado.fraud_analysis.flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-slate-600 dark:text-slate-300 text-base">Nenhum indício inconsistente foi identificado pelo Isolation Forest.</p>
              )}
            </div>
          )}

          {resultado.next_best_action && (
            <div className="p-8 bg-purple-50 dark:bg-purple-950/35 rounded-2xl border border-purple-200 dark:border-purple-800/40 text-base text-purple-900 dark:text-purple-200 space-y-2">
              <span className="font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest text-sm block">Próxima Melhor Ação ({resultado.next_best_action.category})</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-lg">{resultado.next_best_action.action}</h4>
              <p className="text-slate-700 dark:text-slate-200 text-base">{resultado.next_best_action.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}