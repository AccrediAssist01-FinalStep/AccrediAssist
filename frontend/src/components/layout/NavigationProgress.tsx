'use client';

import { useNavigationStore } from '@/hooks/use-navigation-store';
import { motion, AnimatePresence } from 'framer-motion';

export function NavigationProgress() {
  const pendingPath = useNavigationStore((state) => state.pendingPath);

  return (
    <AnimatePresence>
      {pendingPath && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-primary to-secondary shadow-soft"
          role="progressbar"
          aria-label="Loading page"
        />
      )}
    </AnimatePresence>
  );
}
