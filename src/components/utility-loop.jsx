"use client";

import { useEffect, useRef } from "react";

const items = [
  ["01", "Partner sesuai level", "Bermain dengan orang yang cocok dengan kemampuan Anda."],
  ["02", "Match dan coaching", "Cari permainan atau sesi latihan sesuai kebutuhan."],
  ["03", "Event komunitas", "Temukan kegiatan badminton untuk bermain bersama."],
  ["04", "Rating setelah bermain", "Bangun pengalaman bermain yang sportif."],
  ["05", "Sewa raket", "Siapkan raket saat tidak membawa perlengkapan sendiri."],
  ["06", "Beli shuttlecock", "Lengkapi kebutuhan bermain dari satu aplikasi."],
];

function LoopGroup({ duplicate = false, groupRef }) {
  return (
    <div ref={groupRef} className="utility-loop-group" aria-hidden={duplicate || undefined}>
      {items.map(([number, title, description]) => (
        <article className="utility-loop-item" key={number}>
          <span className="utility-loop-number">{number}</span>
          <div><h2>{title}</h2><p>{description}</p></div>
        </article>
      ))}
    </div>
  );
}

export default function UtilityLoop() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!section || !track || !group) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let frame;
    let offset = 0;
    let lastTime = 0;
    let lastScrollY = window.scrollY;
    let direction = -1;
    let scrollBoost = 0;
    let visible = false;

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      if (Math.abs(delta) > 1) direction = delta > 0 ? -1 : 1;
      scrollBoost = Math.min(Math.abs(delta) * 0.16, 2.5);
      lastScrollY = window.scrollY;
    };

    const animate = (time) => {
      if (!visible) return;
      const delta = Math.min((time - (lastTime || time)) / 16.67, 2);
      lastTime = time;
      const groupWidth = group.getBoundingClientRect().width;
      if (groupWidth > 0) {
        offset += direction * (0.32 + scrollBoost) * delta;
        scrollBoost *= 0.92;
        offset = ((offset % groupWidth) + groupWidth) % groupWidth;
        track.style.transform = `translate3d(${-groupWidth + offset}px, 0, 0)`;
      }
      frame = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        lastTime = 0;
        frame = requestAnimationFrame(animate);
      } else if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    });
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="utility-loop" aria-label="Manfaat SmashMate">
      <div ref={trackRef} className="utility-loop-track">
        <LoopGroup duplicate />
        <LoopGroup groupRef={groupRef} />
      </div>
    </section>
  );
}
