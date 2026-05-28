import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhyAttendSection } from "@/components/sections/WhyAttendSection";
import { ForWhomSection } from "@/components/sections/ForWhomSection";
import { ScheduleSection } from "@/components/sections/ScheduleSection";
import { RegisterSection } from "@/components/sections/RegisterSection";
import { Marquee } from "@/components/ui/Marquee";
import { VkLogo } from "@/components/ui/VkLogo";

export default function Home() {
  return (
    <div className="page-wrapper min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <Marquee />
        <WhyAttendSection />
        <Marquee />
        <ForWhomSection />
        <Marquee />
        <ScheduleSection />
        <RegisterSection />
      </main>
      <footer className="border-t border-white/[0.08] py-10">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <VkLogo size={24} />
            <span className="font-[family-name:var(--font-unbounded)] text-sm text-white">
              tech · VK Cloud Conf&apos;26
            </span>
          </div>
          <p className="text-center text-sm text-white/40">
            © 2026 VK Tech. 17 июня · Москва · Loft 8 «Серп и Молот»
          </p>
        </div>
      </footer>
    </div>
  );
}
