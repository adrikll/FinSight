import React, { useState } from 'react';

export default function SimuladorCredito() {
  const [formData, setFormData] = useState({
    name: '',
    age: '30',
    annualincome: '90.000,00',
    monthlyincome: '7.500,00',
    employmentstatus: 'employed',
    educationlevel: 'bachelor',
    experience: '5',
    loanamount: '20.000,00',
    loanduration: '36',
    maritalstatus: 'single',
    numberofdependents: '0',
    homeownershipstatus: 'rent',
    monthlydebtpayments: '1.200,00',
    creditcardutilizationrate: '0.3',
    savingsaccountbalance: '15.000,00',
    checkingaccountbalance: '4.000,00',
    totalassets: '50.000,00',
    totalliabilities: '10.000,00',
    jobtenure: '3',
    networth: '40.000,00',
    loanpurpose: 'debt consolidation',
    uf: 'SP'
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // Função para formatar o número enquanto o usuário digita (ex: 7500 vira 7.500)
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

  // Converte a string formatada em float puro para enviar à API
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-lg border border-slate-800/80">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Simulador Inteligente de Crédito</h2>
          <p className="text-sm text-slate-400 mt-1">
            Análise de risco baseada em perfil socioeconômico e capacidade financeira declarada.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 p-8 rounded-lg border border-slate-800/80 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome Completo do Cliente</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Digite o nome completo" className="w-full p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual a sua idade?</label>
            <input type="number" name="age" required value={formData.age} onChange={handleChange} placeholder="Ex: 30" className="w-full p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual o valor da sua Renda Mensal?</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="monthlyincome" required value={formData.monthlyincome} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual o valor da sua Renda Anual estimada?</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="annualincome" required value={formData.annualincome} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Quanto de empréstimo você deseja solicitar?</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="loanamount" required value={formData.loanamount} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Quanto você paga de dívidas/empréstimos por mês?</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="monthlydebtpayments" required value={formData.monthlydebtpayments} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Valor Total dos Seus Bens (Carros, Imóveis, Investimentos...)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="totalassets" required value={formData.totalassets} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Valor Total de Outras Dívidas Ativas (Financiamentos, Cartões...)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="totalliabilities" required value={formData.totalliabilities} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Patrimônio Líquido Estimado (Bens menos Dívidas)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
              <input type="text" name="networth" required value={formData.networth} onChange={handleCurrencyChange} className="w-full pl-9 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual a sua Situação Profissional?</label>
            <select name="employmentstatus" value={formData.employmentstatus} onChange={handleChange} className="w-full p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none">
              <option value="employed">Empregado (CLT)</option>
              <option value="self-employed">Autônomo / Empresário</option>
              <option value="unemployed">Desempregado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual a finalidade deste empréstimo?</label>
            <select name="loanpurpose" value={formData.loanpurpose} onChange={handleChange} className="w-full p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none">
              <option value="debt consolidation">Quitação de Dívidas</option>
              <option value="home improvement">Reforma Residencial</option>
              <option value="business">Investimento no Negócio</option>
              <option value="personal">Pessoal / Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Qual o seu Estado (UF)?</label>
            <input type="text" name="uf" maxLength={2} required value={formData.uf} onChange={handleChange} placeholder="Ex: SP, RJ, CE" className="w-full p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-sm text-white uppercase focus:border-purple-500 focus:outline-none" />
          </div>

          <div className="md:col-span-3 mt-2">
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 font-medium rounded-lg text-white transition-colors shadow-lg shadow-purple-900/20 text-sm">
              {loading ? 'Processando Análise com IA...' : 'Simular Crédito com IA'}
            </button>
          </div>
        </form>

        {erro && <div className="mt-4 p-4 bg-red-950/40 border border-red-700/50 text-red-300 rounded-lg text-xs">{erro}</div>}

        {resultado && resultado.evaluation && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
            <h3 className="text-sm font-medium text-white mb-3">Resultado Detalhado da Análise de Crédito</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">DECISÃO</span>
                <p className={`text-base font-semibold ${resultado.evaluation.status === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {resultado.evaluation.status}
                </p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">NÍVEL DE RISCO</span>
                <p className="text-base font-semibold text-amber-400">{resultado.evaluation.risk_rating}</p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">SCORE DE PROBABILIDADE</span>
                <p className="text-base font-semibold text-cyan-400">{resultado.evaluation.approval_probability}%</p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">LIMITE DISPONÍVEL</span>
                <p className="text-base font-semibold text-white">R$ {resultado.evaluation.approved_limit.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-white font-medium block mb-1">Análise Explicativa do Perfil:</strong> 
              {resultado.evaluation.decision_reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}