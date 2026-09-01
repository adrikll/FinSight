import { LayoutGrid, Users, CreditCard, ShieldCheck, AlertTriangle, Workflow, FileText, Bell, Settings } from 'lucide-react';
import Logo from './Logo';

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'visao360', label: 'Visão 360°', icon: Users },
  { id: 'credito', label: 'Análise de Crédito', icon: CreditCard },
  { id: 'risco', label: 'Risco & Modelos', icon: ShieldCheck },
  { id: 'fraude', label: 'Fraude', icon: AlertTriangle },
  { id: 'automacao', label: 'Automação', icon: Workflow },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'config', label: 'Configurações', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-56 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-4">
      <div>
        <div className="px-2 mb-6"><Logo /></div>
        <nav className="space-y-1">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${activeTab === id ? 'bg-purple-600/15 text-purple-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}