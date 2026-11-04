"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "@/components/loading-link";

export default function ScrollExpansionHero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const intro = section.querySelector(".smash-hero-intro");
    const caption = section.querySelector(".smash-hero-caption");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = reducedMotion.matches ? 1 : Math.min(Math.max(-rect.top / travel, 0), 1);
      section.style.setProperty("--hero-progress", progress.toFixed(3));
      intro.inert = !reducedMotion.matches && progress > 0.55;
      caption.inert = reducedMotion.matches || progress < 0.7;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    reducedMotion.addEventListener("change", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="smash-hero" aria-labelledby="smash-hero-title">
      <div className="smash-hero-sticky">
        <div className="smash-hero-intro precision-shell">
          <span className="precision-badge">🏸 Tempatnya pemain badminton</span>
          <h1 id="smash-hero-title">Lebih mudah main<br /><span>bareng di lapangan.</span></h1>
          <p>Temukan mabar, booking GOR, dan siapkan raket serta shuttlecock dalam satu tempat.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/login?next=%2Factivities" className="precision-button primary large">Cari Main Bareng</Link>
            <Link href="/login?next=%2Fvenues" className="precision-button secondary large">Cari Lapangan</Link>
          </div>
        </div>

        <div className="smash-hero-media">
          <Image src="/images/badminton-hero-v2.png" alt="Empat pemain badminton bermain ganda bersama di lapangan indoor" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="smash-hero-media-shade" />
          <div className="smash-hero-caption">
            <span>SMASHMATE · MAIN BARENG</span>
            <strong>Dari cari teman sampai turun ke lapangan.</strong>
            <Link href="/register" className="precision-button light">Mulai bermain</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
