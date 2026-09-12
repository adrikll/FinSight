import React, { useState } from 'react';
import API_URL from '../api';

export default function SimuladorCredito() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    annualincome: '',
    monthlyincome: '',
    employmentstatus: 'employed',
    educationlevel: '',
    experience: '',
    loanamount: '',
    loanduration: '12',
    maritalstatus: '',
    numberofdependents: '0',
    homeownershipstatus: '',
    monthlydebtpayments: '',
    creditcardutilizationrate: '',
    savingsaccountbalance: '',
    checkingaccountbalance: '',
    totalassets: '',
    totalliabilities: '',
    jobtenure: '',
    networth: '',
    loanpurpose: 'debt consolidation',
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
      const response = await fetch(`${API_URL}/predict`, {
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
    <div className="space-y-8 w-full max-w-full pb-16 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Simulador Inteligente de Crédito</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2">
          Preencha os campos abaixo para realizar a análise de risco baseada em seu perfil socioeconômico.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BLOCO 1 */}
        <div className="bg-white dark:bg-slate-900/40 p-5 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-5 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">Informações Pessoais e Profissionais</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Dados cadastrais básicos do solicitante.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Nome Completo do Cliente</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex: João da Silva" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Idade</label>
                <input 
                  type="number" 
                  name="age" 
                  required 
                  value={formData.age} 
                  onChange={handleChange} 
                  placeholder="Ex: 30" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Situação Profissional</label>
                <select 
                  name="employmentstatus" 
                  value={formData.employmentstatus} 
                  onChange={handleChange} 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none"
                >
                  <option value="employed">Empregado (CLT)</option>
                  <option value="self-employed">Autônomo / Empresário</option>
                  <option value="unemployed">Desempregado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Estado (UF)</label>
                <input 
                  type="text" 
                  name="uf" 
                  maxLength={2} 
                  required 
                  value={formData.uf} 
                  onChange={handleChange} 
                  placeholder="Ex: SP" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base uppercase focus:border-purple-500 focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2 */}
        <div className="bg-white dark:bg-slate-900/40 p-5 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-5 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">Renda, Dívidas e Solicitação de Crédito</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Detalhes financeiros pretendidos.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Renda Mensal</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="monthlyincome" 
                    required 
                    value={formData.monthlyincome} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 7.500,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Renda Anual Estimada</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="annualincome" 
                    required 
                    value={formData.annualincome} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 90.000,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Valor do Empréstimo Desejado</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="loanamount" 
                    required 
                    value={formData.loanamount} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 20.000,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Pagamento Mensal de Dívidas Atuais</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="monthlydebtpayments" 
                    required 
                    value={formData.monthlydebtpayments} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 1.200,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Finalidade do Empréstimo</label>
              <select 
                name="loanpurpose" 
                value={formData.loanpurpose} 
                onChange={handleChange} 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none"
              >
                <option value="debt consolidation">Quitação de Dívidas</option>
                <option value="home improvement">Reforma Residencial</option>
                <option value="business">Investimento no Negócio</option>
                <option value="personal">Pessoal / Geral</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 3 */}
        <div className="bg-white dark:bg-slate-900/40 p-5 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-5 shadow-sm transition-colors">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">Patrimônio e Passivos</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5">Composição patrimonial.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Bens Totais</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="totalassets" 
                    required 
                    value={formData.totalassets} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 50.000,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Outras Dívidas Ativas</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="totalliabilities" 
                    required 
                    value={formData.totalliabilities} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 10.000,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Patrimônio Líquido Estimado</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs md:text-sm font-semibold text-slate-500">R$</span>
                  <input 
                    type="text" 
                    name="networth" 
                    required 
                    value={formData.networth} 
                    onChange={handleCurrencyChange} 
                    placeholder="Ex: 40.000,00"
                    className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base focus:border-purple-500 focus:outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Envio */}
        <div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 md:py-5 bg-purple-600 hover:bg-purple-500 font-bold rounded-2xl text-white transition-all shadow-xl shadow-purple-900/40 text-base md:text-lg cursor-pointer"
          >
            {loading ? 'Processando Análise com IA...' : 'Simular Crédito com IA'}
          </button>
        </div>
      </form>

      {erro && <div className="p-4 md:p-6 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-2xl text-sm">{erro}</div>}

      {/* Resultados */}
      {resultado && resultado.evaluation && (
        <div className="bg-white dark:bg-slate-900/80 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-2xl transition-colors">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">Resultado Detalhado da Análise</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold block mb-1 uppercase">Decisão</span>
              <p className={`text-xl font-bold ${resultado.evaluation.status === 'APROVADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {resultado.evaluation.status}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold block mb-1 uppercase">Risco</span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{resultado.evaluation.risk_rating}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold block mb-1 uppercase">Score</span>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{resultado.evaluation.approval_probability}%</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold block mb-1 uppercase">Limite</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">R$ {resultado.evaluation.approved_limit.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-bold block mb-1">Análise Explicativa:</strong> 
            {resultado.evaluation.decision_reason}
          </div>
        </div>
      )}
    </div>
  );
}