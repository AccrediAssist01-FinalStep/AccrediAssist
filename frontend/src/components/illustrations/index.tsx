export function DashboardIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="30" width="160" height="100" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="36" y="50" width="60" height="8" rx="4" fill="#2563EB" fillOpacity="0.3" />
      <rect x="36" y="68" width="128" height="6" rx="3" fill="#CBD5E1" />
      <rect x="36" y="82" width="100" height="6" rx="3" fill="#CBD5E1" />
      <rect x="36" y="100" width="40" height="20" rx="6" fill="#2563EB" fillOpacity="0.2" />
      <rect x="84" y="100" width="40" height="20" rx="6" fill="#7C3AED" fillOpacity="0.2" />
      <rect x="132" y="100" width="32" height="20" rx="6" fill="#10B981" fillOpacity="0.2" />
      <circle cx="160" cy="40" r="16" fill="#7C3AED" fillOpacity="0.15" />
      <path d="M160 32v16M152 40h16" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptySearchIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="88" cy="72" r="36" stroke="#2563EB" strokeWidth="3" fill="#EFF6FF" />
      <path d="M114 98l28 28" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <path d="M76 72h24M88 60v24" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function NoNotificationsIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 24c-22 0-40 16-40 36v20l-12 16h104l-12-16V60c0-20-18-36-40-36z" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
      <path d="M84 128a16 16 0 0 0 32 0" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="130" cy="44" r="8" fill="#10B981" fillOpacity="0.3" />
    </svg>
  );
}

export function NoPendingIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="40" y="24" width="120" height="112" rx="12" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="2" />
      <path d="M72 80l16 16 32-32" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportsIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="36" y="20" width="128" height="120" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="52" y="40" width="96" height="8" rx="4" fill="#2563EB" fillOpacity="0.35" />
      <rect x="52" y="58" width="72" height="6" rx="3" fill="#CBD5E1" />
      <rect x="52" y="72" width="88" height="6" rx="3" fill="#CBD5E1" />
      <rect x="52" y="86" width="64" height="6" rx="3" fill="#CBD5E1" />
      <rect x="52" y="108" width="40" height="18" rx="6" fill="#7C3AED" fillOpacity="0.25" />
      <rect x="100" y="108" width="48" height="18" rx="6" fill="#2563EB" fillOpacity="0.2" />
      <path d="M148 36l12 12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      <circle cx="156" cy="28" r="10" fill="#7C3AED" fillOpacity="0.15" />
    </svg>
  );
}

export function ErrorIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="80" r="48" fill="#FEF2F2" stroke="#FECACA" strokeWidth="2" />
      <path d="M100 56v32M100 104v4" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
