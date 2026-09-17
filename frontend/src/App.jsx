import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SimuladorCredito from './components/SimuladorCredito';
import FraudDashboard from './components/FraudDashboard';
import RiskModelsDashboard from './components/RiskModelsDashboard';
import API_URL from './api';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [dadosGlobais, setDadosGlobais] = useState({
    dashboard: null,
    fraude: null,
    risco: null,
    macro: null
  });
  const [carregandoGlobal, setCarregandoGlobal] = useState(true);
  const [erroGlobal, setErroGlobal] = useState(null);

  const carregarDadosEmSegundoPlano = async () => {
    setCarregandoGlobal(true);
    setErroGlobal(null);
    try {
      const response = await fetch(`${API_URL}/api/initial-load`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error("Erro ao carregar dados consolidados do servidor.");
      }

      setDadosGlobais({
        dashboard: data.dashboard,
        fraude: data.fraude,
        risco: data.risco,
        macro: data.macro
      });
    } catch (err) {
      setErroGlobal("Erro ao conectar com a API na nuvem. O servidor pode estar inicializando.");
    } finally {
      setCarregandoGlobal(false);
    }
  };

  useEffect(() => {
    carregarDadosEmSegundoPlano();
  }, []);

  if (carregandoGlobal) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-purple-500" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold">Aquecendo o Servidor e Sincronizando o FinSight...</h2>
          <p className="text-xs text-slate-400">Isso pode levar alguns segundos caso o container no Render esteja iniciando.</p>
        </div>
      </div>
    );
  }

  if (erroGlobal && !dadosGlobais.dashboard) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-lg text-center space-y-4 max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Falha na Conexão</h3>
          <p className="text-sm text-red-300">{erroGlobal}</p>
          <button 
            onClick={carregarDadosEmSegundoPlano}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-30">
        <span className="font-bold text-lg text-slate-800 dark:text-white">Fin<span className="text-purple-600">Sight</span></span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none border border-slate-200 dark:border-slate-700"
        >
          ☰ Menu
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-none md:max-h-screen w-full transition-all">
        {activeTab === 'dashboard' && <Dashboard dadosCache={dadosGlobais.dashboard} macroCache={dadosGlobais.macro} />}
        {activeTab === 'credito' && <SimuladorCredito />}
        {activeTab === 'risco' && <RiskModelsDashboard dadosCache={dadosGlobais.risco} />}
        {activeTab === 'fraude' && <FraudDashboard dadosCache={dadosGlobais.fraude} />}

        {['dashboard', 'credito', 'risco', 'fraude'].indexOf(activeTab) === -1 && (
          <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-sm transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-300 mb-2">Módulo [{activeTab.toUpperCase()}] em Desenvolvimento</h3>
            <p className="text-sm text-slate-500">Este ambiente corporativo será integrado nas próximas etapas do projeto.</p>
          </div>
        )}
      </main>
    </div>
  );
}