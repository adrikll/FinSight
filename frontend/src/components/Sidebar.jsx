import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LayoutDashboard, AlertOctagon, Calculator, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Panorama Nacional', icon: LayoutDashboard },
    { id: 'fraude', label: 'Monitor Pix e Fraudes', icon: AlertOctagon },
    { id: 'credito', label: 'Simulador de Crédito', icon: Calculator },
    { id: 'risco', label: 'Governança de IA', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Overlay escuro para mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity backdrop-blur-sm"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col justify-between p-3.5 transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl w-56' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-56'}
      `}>
        <div>
          {/* Cabeçalho dinâmico*/}
          {isCollapsed ? (
            <div className="hidden md:flex flex-col items-center gap-3 mb-6">
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
                title="Expandir Menu"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6 px-1 gap-2">
              <div className="overflow-hidden">
                <Logo />
              </div>
              {/* Botão fechar mobile */}
              <button 
                onClick={() => setIsOpen(false)} 
                className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold shrink-0"
              >
                ✕
              </button>
              {/* Botão recolher desktop */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                title="Recolher Menu"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  title={isCollapsed ? item.label : ''}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className={`${isCollapsed ? 'md:hidden' : 'block'} truncate`}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleTheme}
            title="Alternar Tema"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700/50 ${
              isCollapsed ? 'md:justify-center md:px-2' : ''
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              {theme === 'dark' ? <Sun size={15} className="text-amber-500 shrink-0" /> : <Moon size={15} className="text-purple-500 shrink-0" />}
              <span className={`${isCollapsed ? 'md:hidden' : 'block'} truncate`}>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </span>
            <span className={`${isCollapsed ? 'md:hidden' : 'block'} w-1.5 h-1.5 rounded-full shrink-0 ${theme === 'dark' ? 'bg-amber-500' : 'bg-purple-500'}`}></span>
          </button>
        </div>
      </aside>
    </>
  );
}