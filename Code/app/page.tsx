import About from "@/components/About";
import Expertise from "@/components/Expertise";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Impact from "@/components/Impact";
import Journey from "@/components/Journey";
import Marquee from "@/components/Marquee";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import Process from "@/components/Process";
import Work from "@/components/Work";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Expertise />
        <Work />
        <Motion />
        <Impact />
        <Journey />
        <Process />
        <About />
      </main>
      <Footer />
    </>
  );
}
