import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { FeatureGrid } from "@/components/feature-grid";
import { AdBanners } from "@/components/ads/ad-banners";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <AdBanners />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  );
}
