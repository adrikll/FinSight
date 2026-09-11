export default function Logo() {
  return (
    <div className="flex items-center gap-3.5">
      {/* Logotipo*/}
      <div className="relative w-11 h-11 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center shadow-sm">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18V14" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M9 18V10" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 18V6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M19 18V11" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M3 8L9 5L15 9L21 4" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Nome FinSight*/}
      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Fin<span className="text-purple-600 dark:text-purple-400">Sight</span>
      </span>
    </div>
  );
}