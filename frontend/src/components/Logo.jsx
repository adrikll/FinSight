export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#7c3aed" />
        <path d="M7 18L11.5 12.5L15 16L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">FinSight</span>
    </div>
  );
}