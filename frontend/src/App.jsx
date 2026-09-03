import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SimuladorCredito from './components/SimuladorCredito';
import Customer360 from './components/Customer360';
import FraudDashboard from './components/FraudDashboard'; // <--- Importação correta

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <Dashboard />
        </div>
        
        {activeTab === 'visao360' && <Customer360 />}
        {activeTab === 'credito' && <SimuladorCredito />}
        {activeTab === 'fraude' && <FraudDashboard />} {/* <--- Renderiza o novo painel Pix/Fraude */}

        {activeTab !== 'dashboard' && activeTab !== 'visao360' && activeTab !== 'credito' && activeTab !== 'fraude' && (
          <div className="h-96 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <h3 className="text-xl font-bold text-slate-300 mb-2">Módulo [{activeTab.toUpperCase()}] em Desenvolvimento</h3>
            <p className="text-sm text-slate-500">Este ambiente corporativo será integrado nas próximas etapas do projeto.</p>
          </div>
        )}
      </main>
    </div>
  );
}