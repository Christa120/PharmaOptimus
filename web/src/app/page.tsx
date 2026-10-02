import { Navbar }             from '@/components/home/Navbar'
import { HeroSection }        from '@/components/home/HeroSection'
import { ProblemSection }     from '@/components/home/ProblemSection'
import { SolutionSection }    from '@/components/home/SolutionSection'
import { HowItWorksSection }  from '@/components/home/HowItWorksSection'
import { MapPreviewSection }  from '@/components/home/MapPreviewSection'
import { DataBadgesSection }  from '@/components/home/DataBadgesSection'
import { CtaBannerSection }   from '@/components/home/CtaBannerSection'
import { SiteFooter }         from '@/components/home/SiteFooter'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" id="home-main">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <MapPreviewSection />
        <DataBadgesSection />
        <CtaBannerSection />
      </main>
      <SiteFooter />
    </div>
  )
}
