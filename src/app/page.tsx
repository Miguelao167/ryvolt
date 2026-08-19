import { HeroSection, FeaturesSection, StatsSection, CapabilitiesSection, CTASection, Footer, Navbar } from '@/components/landing'
import { TooltipProvider } from '@/components/ui'

export default function HomePage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-discord-darker">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <div id="capabilities">
          <CapabilitiesSection />
        </div>
        <CTASection />
        <Footer />
      </main>
    </TooltipProvider>
  )
}
