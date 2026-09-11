import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LayoutDashboard, AlertOctagon, Calculator, ShieldCheck } from 'lucide-react';
import Logo from './Logo'; 

export default function Sidebar({ activeTab, setActiveTab }) {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Panorama Nacional', icon: LayoutDashboard },
    { id: 'fraude', label: 'Monitor Pix e Fraudes', icon: AlertOctagon },
    { id: 'credito', label: 'Simulador de Crédito', icon: Calculator },
    { id: 'risco', label: 'Governança de IA', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 transition-colors">
      <div>
        {/* Logo integrada e centralizada na barra */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <Logo />
        </div>

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
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700/50"
          title="Alternar Modo Claro / Escuro"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-purple-500" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${theme === 'dark' ? 'bg-amber-500' : 'bg-purple-500'}`}></span>
        </button>
      </div>
    </aside>
  );
}