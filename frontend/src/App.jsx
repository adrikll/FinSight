import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SimuladorCredito from './components/SimuladorCredito';
import FraudDashboard from './components/FraudDashboard';
import RiskModelsDashboard from './components/RiskModelsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
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