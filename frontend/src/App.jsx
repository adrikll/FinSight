import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SimuladorCredito from './components/SimuladorCredito';
import FraudDashboard from './components/FraudDashboard';
import RiskModelsDashboard from './components/RiskModelsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      
      {/* Barra superior mobile */}
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
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'credito' && <SimuladorCredito />}
        {activeTab === 'risco' && <RiskModelsDashboard />}
        {activeTab === 'fraude' && <FraudDashboard />}

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