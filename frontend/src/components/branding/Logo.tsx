import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 48, text: 'text-2xl' },
};

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
        {/* Document */}
        <path
          d="M14 12h12l6 6v18a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
          fill="white"
          fillOpacity="0.95"
        />
        <path d="M26 12v6h6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 22h12M16 26h8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
        {/* Graduation cap */}
        <path
          d="M30 8l8 4-8 4-8-4 8-4z"
          fill="white"
          fillOpacity="0.9"
        />
        <path d="M34 12v4c0 1.5-2 3-6 3s-6-1.5-6-3v-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        {/* AI spark */}
        <circle cx="36" cy="34" r="6" fill="white" fillOpacity="0.95" />
        <path
          d="M36 31v6M33 34h6"
          stroke="#7C3AED"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M34 32l1 1M38 32l-1 1M34 36l1-1M38 36l-1-1"
          stroke="#2563EB"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold tracking-tight text-foreground', text)}>
            Accredi<span className="text-primary">Assist</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            Accreditation Platform
          </span>
        </div>
      )}
    </div>
  );
}
