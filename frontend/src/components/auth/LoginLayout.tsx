'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/branding/Logo';
import { LoginHeroIllustration } from '@/components/auth/LoginHeroIllustration';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginLayout() {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Left hero panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden lg:flex">
        <motion.div
          className="absolute inset-0 gradient-primary"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(124,58,237,0.2),transparent_50%)]" />

        <div className="relative z-10 p-10 xl:p-14">
          <Logo variant="light" size="lg" subtitle="Faculty Portal" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10">
          <LoginHeroIllustration />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 max-w-lg text-center text-white"
          >
            <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              AI-Powered Academic Accreditation &amp; Intelligence Platform
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Streamline NAAC and NBA compliance with intelligent document processing, smart
              search, and real-time institutional analytics.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <p className="text-sm text-white/60">
            Secure enterprise authentication · Trusted by academic institutions
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.06),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(124,58,237,0.05),transparent_40%)]" />
        <LoginForm />
      </div>
    </div>
  );
}
