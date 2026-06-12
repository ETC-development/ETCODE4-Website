import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Format from "@/components/sections/Format";
import Agenda from "@/components/sections/Agenda";
import Mentors from "@/components/sections/Mentors";
import Faq from "@/components/sections/Faq";
import Prizes from "@/components/sections/Prizes";
import Sponsors from "@/components/sections/Sponsors";
import PastEditions from "@/components/sections/PastEditions";
import Footer from "@/components/sections/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import RouteWipe from "@/components/ui/RouteWipe";

export default function Home() {
  return (
    <>
      <RouteWipe />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Format />
        <Agenda />
        <Mentors />
        <PastEditions />
        <Faq />
        <Prizes />
        <Sponsors />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
