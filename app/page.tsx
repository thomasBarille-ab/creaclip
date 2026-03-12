import {
  Navbar,
  HeroSection,
  LogoBar,
  ProductDemo,
  HowItWorks,
  PricingSection,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      {/* <LogoBar /> */}
      <ProductDemo />
      <HowItWorks />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
