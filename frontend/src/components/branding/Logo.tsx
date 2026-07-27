import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
}

const sizes = {
  sm: { icon: 32, title: 'text-base', subtitle: 'text-[9px]' },
  md: { icon: 40, title: 'text-xl', subtitle: 'text-[10px]' },
  lg: { icon: 52, title: 'text-2xl', subtitle: 'text-xs' },
};

export function Logo({
  className,
  showText = true,
  subtitle = 'Faculty Portal',
  size = 'md',
  variant = 'default',
}: LogoProps) {
  const { icon, title, subtitle: subtitleSize } = sizes[size];
  const isLight = variant === 'light';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
        aria-label="AccrediAssist logo"
      >
        <defs>
          <linearGradient id="aa-logo-grad" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="56" height="56" rx="14" fill="url(#aa-logo-grad)" />

        {/* Document */}
        <path
          d="M16 14h14l7 7v22a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"
          fill="white"
          fillOpacity="0.95"
        />
        <path d="M30 14v7h7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 26h14M18 31h10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />

        {/* Graduation cap */}
        <path d="M34 10l10 5-10 5-10-5 10-5z" fill="white" fillOpacity="0.95" />
        <path d="M38 15v5c0 2-3 4-8 4s-8-2-8-4v-5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />

        {/* AI circuit */}
        <circle cx="42" cy="40" r="7" fill="white" fillOpacity="0.95" />
        <path d="M42 36v8M38 40h8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M40 38l1.5 1.5M44 38l-1.5 1.5M40 42l1.5-1.5M44 42l-1.5-1.5"
          stroke="#2563EB"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line x1="35" y1="40" x2="30" y2="40" stroke="white" strokeWidth="1" opacity="0.6" />
        <circle cx="28" cy="40" r="2" fill="white" opacity="0.8" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'font-bold tracking-tight',
              title,
              isLight ? 'text-white' : 'text-foreground',
            )}
          >
            Accredi<span className={isLight ? 'text-white/90' : 'text-primary'}>Assist</span>
          </span>
          {subtitle && (
            <span
              className={cn(
                'mt-1 font-semibold uppercase tracking-[0.15em]',
                subtitleSize,
                isLight ? 'text-white/70' : 'text-muted',
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
