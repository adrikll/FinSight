import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SimuladorCenarios from './components/SimuladorCenarios';
import Customer360 from './components/Customer360'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar Lateral */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {activeTab === 'dashboard' && <Dashboard />}
        
        {/* Adicione esta condição para a Visão 360° */}
        {activeTab === 'visao360' && <Customer360 />}

        {activeTab === 'credito' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-black text-white mb-1">Simulador de Cenários de Carteira</h2>
              <p className="text-sm text-slate-400">Simulações agregadas sobre a base oficial do Banco Central — sem dados individuais.</p>
            </div>
            <SimuladorCenarios />
          </div>
        )}

        {/* Proteção para outros módulos ainda em desenvolvimento */}
        {activeTab !== 'dashboard' && activeTab !== 'visao360' && activeTab !== 'credito' && (
          <div className="h-96 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <h3 className="text-xl font-bold text-slate-300 mb-2">Módulo [{activeTab.toUpperCase()}] em Desenvolvimento</h3>
            <p className="text-sm text-slate-500">Este ambiente corporativo será integrado nas próximas etapas do projeto.</p>
          </div>
        )}
      </main>
    </div>
  );
}