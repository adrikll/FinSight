import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function KpiCard({ icon: Icon, title, value, delta, deltaSufixo, deltaInvertido, trend }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 8,
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '11px',
    padding: '6px 10px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  const positivo = delta !== undefined && delta !== null && (deltaInvertido ? delta <= 0 : delta >= 0);
  const safeId = title ? title.replace(/[^a-zA-Z0-9]/g, '') : 'kpi';
  
  const trendFormatado = trend ? trend.map(t => {
    if (typeof t === 'object' && t !== null) {
      return { valor: Number(t.valor ?? t.val ?? 0), data: t.data || t.index };
    }
    return { valor: Number(t) || 0 };
  }) : [];

  const valores = trendFormatado.map(t => t.valor).filter(v => typeof v === 'number' && !isNaN(v));
  const minVal = valores.length > 0 ? Math.min(...valores) : 0;
  const maxVal = valores.length > 0 ? Math.max(...valores) : 1;
  const margem = (maxVal - minVal) * 0.2 || 0.5;
  const domainMin = Number((minVal - margem).toFixed(2));
  const domainMax = Number((maxVal + margem).toFixed(2));

  return (
    <div className="bg-white dark:bg-slate-900/80 p-5 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col gap-1 relative overflow-hidden shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <span className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight text-center block">{value}</span>
      {delta !== undefined && delta !== null && (
        <span className={`text-xs font-medium text-center block ${positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}{deltaSufixo || '%'} vs. mês anterior
        </span>
      )}
      {trendFormatado.length > 1 && (
        <div className="h-12 mt-2 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendFormatado} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <YAxis domain={[domainMin, domainMax]} hide />
              <Tooltip 
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#a855f7', fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0 && payload[0].payload.data) {
                    return `Data: ${payload[0].payload.data}`;
                  }
                  return `Data: ${label}`;
                }}
                formatter={(val) => [`${val}`, title]}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#a855f7" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#gradient-${safeId})`} 
                dot={false}
                activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}