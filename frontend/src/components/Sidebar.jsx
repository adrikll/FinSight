import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Importe o hook do contexto
import { Sun, Moon, LayoutDashboard, Calculator, ShieldCheck, AlertOctagon } from 'lucide-react'; // Ou os ícones que você já usa

export default function Sidebar({ activeTab, setActiveTab }) {
  const { theme, toggleTheme } = useTheme(); // Pega o tema atual e a função de alternância

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'credito', label: 'Análise de Crédito', icon: Calculator },
    { id: 'risco', label: 'Risco & Modelos', icon: ShieldCheck },
    { id: 'fraude', label: 'Fraude', icon: AlertOctagon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 transition-colors">
      <div>
        {/* Logo / Título do App */}
        <div className="flex items-center gap-3 mb-10">
          <h1 className="text-xl font-bold text-white tracking-wide">FinSight</h1>
        </div>

        {/* Links de navegação */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* RODAPÉ DA SIDEBAR: Botão de Alternância de Tema */}
      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700/50"
          title="Alternar Modo Claro / Escuro"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-purple-400" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
          {/* Indicador visual de status do tema */}
          <span className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-amber-400' : 'bg-purple-500'}`}></span>
        </button>
      </div>
    </aside>
  );
}