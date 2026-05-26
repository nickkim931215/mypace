import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { FeatureGrid } from "@/components/feature-grid";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  );
}
