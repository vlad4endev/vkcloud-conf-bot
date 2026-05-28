"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GridBackground } from "@/components/canvas/GridBackground";
import { VkLogo } from "@/components/ui/VkLogo";

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function HeroFormulas() {
  return (
    <svg
      className="pointer-events-none absolute right-4 top-24 hidden w-[min(320px,28vw)] text-white/40 lg:block xl:right-12"
      viewBox="0 0 280 120"
      fill="none"
      aria-hidden
    >
      <text
        x="0"
        y="16"
        fill="currentColor"
        fontSize="11"
        fontFamily="var(--font-jetbrains-var), monospace"
      >
        a₀ = 4πε₀ℏ²/mₑq²
      </text>
      <text
        x="0"
        y="38"
        fill="currentColor"
        fontSize="11"
        fontFamily="var(--font-jetbrains-var), monospace"
      >
        iℏ ∂/∂t Ψ = Ĥ Ψ
      </text>
      <text
        x="0"
        y="60"
        fill="currentColor"
        fontSize="10"
        fontFamily="var(--font-jetbrains-var), monospace"
      >
        ∫e⁻ˢφ₁(x₁)...φₙ(xₙ) Dφ
      </text>
      <path
        d="M200 80 L240 60 L260 90 L220 100 Z"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
      />
      <line
        x1="220"
        y1="100"
        x2="200"
        y2="80"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    </svg>
  );
}

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-black">
      <GridBackground parallaxOffset={scrollY} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_700px_900px_at_-8%_45%,rgba(0,40,160,0.55)_0%,transparent_65%),radial-gradient(ellipse_600px_800px_at_108%_65%,rgba(0,30,140,0.45)_0%,transparent_65%)]" />

      <HeroFormulas />

      <div className="absolute right-4 top-20 z-20 flex items-center gap-2 md:right-8 md:top-24">
        <VkLogo />
        <span className="font-[family-name:var(--font-unbounded)] text-base text-white">
          tech
        </span>
      </div>

      <motion.div
        className="absolute left-1/2 top-[12%] z-20 -translate-x-1/2 text-center"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0 }}
      >
        <div className="mb-1 flex flex-col items-center gap-1">
          <span className="h-px w-[60px] bg-white/60" />
          <span className="h-px w-[60px] bg-white/60" />
        </div>
        <div className="border border-white/50 px-8 py-2 font-mono text-sm font-medium uppercase tracking-[0.15em] text-white">
          17 ИЮНЯ
        </div>
      </motion.div>

      <div className="relative z-10 flex min-h-[100vh] flex-col justify-end pb-16 pt-32 md:pb-24">
        <motion.div
          className="px-6 md:pl-[5vw]"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <h1 className="hero-title capitalize">
            <span className="block">Vk Cloud</span>
            <span className="block">Conf&apos;26</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-6 px-6 font-mono text-sm text-white/40 md:pl-[5vw]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Москва · Loft 8 «Серп и Молот» · Проектируем будущее с VK Cloud
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap gap-3 px-6 md:pl-[5vw]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <a
            href="#register"
            className="rounded-lg bg-[#1E6DFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3D82FF]"
          >
            Зарегистрироваться
          </a>
          <a
            href="#program"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm text-white transition hover:border-white/40"
          >
            Программа
          </a>
        </motion.div>
      </div>
    </section>
  );
}
