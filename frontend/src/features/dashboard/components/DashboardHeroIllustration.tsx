export function DashboardHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dash-hero-grad" x1="0" y1="0" x2="320" y2="200">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="20" fill="url(#dash-hero-grad)" />
      <rect x="40" y="50" width="120" height="80" rx="12" fill="white" fillOpacity="0.9" className="dark:fill-slate-800" />
      <rect x="52" y="68" width="60" height="6" rx="3" fill="#2563EB" fillOpacity="0.5" />
      <rect x="52" y="82" width="96" height="4" rx="2" fill="#94A3B8" fillOpacity="0.5" />
      <rect x="52" y="94" width="80" height="4" rx="2" fill="#94A3B8" fillOpacity="0.4" />
      <rect x="52" y="106" width="40" height="14" rx="6" fill="#10B981" fillOpacity="0.3" />
      <circle cx="220" cy="90" r="40" fill="#2563EB" fillOpacity="0.12" />
      <path d="M220 70v40M200 90h40" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M180 140h120" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" opacity="0.3" strokeDasharray="6 6" />
      <circle cx="180" cy="140" r="6" fill="#7C3AED" opacity="0.5" />
      <circle cx="300" cy="140" r="6" fill="#2563EB" opacity="0.5" />
      <polygon points="160,35 190,50 130,50" fill="#7C3AED" fillOpacity="0.7" />
    </svg>
  );
}
