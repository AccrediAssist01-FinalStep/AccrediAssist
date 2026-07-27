'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const floatingItems = [
  { className: 'left-[12%] top-[18%] h-16 w-28', delay: 0 },
  { className: 'right-[14%] top-[28%] h-12 w-36', delay: 0.4 },
  { className: 'left-[20%] bottom-[22%] h-14 w-32', delay: 0.8 },
  { className: 'right-[18%] bottom-[18%] h-20 w-24', delay: 1.2 },
];

export function LoginHeroIllustration() {
  return (
    <div className="relative flex h-full min-h-[420px] w-full items-center justify-center" aria-hidden="true">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 size-64 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 size-48 rounded-full bg-purple-300/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating UI cards */}
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className={cn(
            'absolute rounded-xl border border-white/20 bg-white/10 backdrop-blur-md',
            item.className,
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: item.delay, duration: 0.6 },
            y: { delay: item.delay, duration: 4 + index, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}

      {/* Main illustration */}
      <motion.svg
        viewBox="0 0 400 320"
        className="relative z-10 w-full max-w-md px-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <defs>
          <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* University building silhouette */}
        <rect x="60" y="140" width="280" height="120" rx="8" fill="url(#hero-grad)" opacity="0.9" />
        <rect x="90" y="110" width="60" height="30" rx="4" fill="white" opacity="0.8" />
        <rect x="170" y="90" width="60" height="50" rx="4" fill="white" opacity="0.85" />
        <rect x="250" y="110" width="60" height="30" rx="4" fill="white" opacity="0.8" />
        <polygon points="200,50 260,90 140,90" fill="white" opacity="0.9" />

        {/* Document stack */}
        <rect x="280" y="170" width="70" height="90" rx="6" fill="white" opacity="0.85" />
        <rect x="290" y="160" width="70" height="90" rx="6" fill="white" opacity="0.7" />
        <line x1="300" y1="190" x2="340" y2="190" stroke="#2563EB" strokeWidth="2" opacity="0.6" />
        <line x1="300" y1="205" x2="330" y2="205" stroke="#2563EB" strokeWidth="2" opacity="0.4" />

        {/* AI circuit nodes */}
        <circle cx="120" cy="200" r="24" fill="#7C3AED" opacity="0.9" />
        <path d="M120 188v24M108 200h24" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="120" cy="200" r="32" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        <line x1="144" y1="200" x2="180" y2="200" stroke="white" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" />
        <circle cx="200" cy="200" r="8" fill="white" opacity="0.8" />
        <line x1="208" y1="200" x2="280" y2="200" stroke="white" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" />

        {/* Graduation cap */}
        <polygon points="200,115 240,135 160,135" fill="#2563EB" opacity="0.9" />
        <rect x="185" y="135" width="30" height="8" rx="2" fill="#2563EB" opacity="0.7" />
      </motion.svg>
    </div>
  );
}
