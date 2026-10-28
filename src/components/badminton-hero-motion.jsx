"use client";

import { useEffect, useRef } from "react";

export default function BadmintonHeroMotion() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId;
    let startTime = performance.now();
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * scale);
      canvas.height = Math.round(bounds.height * scale);
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const onPointerMove = (event) => {
      const bounds = wrapper.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const roundedRect = (x, y, width, height, radius) => {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
    };

    const drawRacket = (x, y, rotation, color, opacity = 1) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.globalAlpha = opacity;
      context.strokeStyle = color;
      context.lineWidth = 4;
      context.beginPath();
      context.ellipse(0, 0, 39, 55, 0, 0, Math.PI * 2);
      context.stroke();
      context.lineWidth = 1;
      context.globalAlpha = opacity * 0.45;
      for (let line = -24; line <= 24; line += 12) {
        context.beginPath();
        context.moveTo(line, -43);
        context.lineTo(line, 43);
        context.stroke();
      }
      for (let line = -30; line <= 30; line += 12) {
        context.beginPath();
        context.moveTo(-30, line);
        context.lineTo(30, line);
        context.stroke();
      }
      context.globalAlpha = opacity;
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(0, 54);
      context.lineTo(0, 126);
      context.stroke();
      context.restore();
    };

    const drawShuttle = (x, y, rotation, scale = 1) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(scale, scale);
      context.fillStyle = "#56061D";
      context.beginPath();
      context.arc(0, 10, 8, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#022E4A";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-7, 5);
      context.lineTo(-19, -25);
      context.lineTo(19, -25);
      context.lineTo(7, 5);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.moveTo(-12, -21);
      context.lineTo(-3, 4);
      context.moveTo(0, -24);
      context.lineTo(0, 3);
      context.moveTo(12, -21);
      context.lineTo(3, 4);
      context.stroke();
      context.restore();
    };

    const render = (time) => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      const elapsed = reducedMotion ? 0.28 : ((time - startTime) % 4200) / 4200;
      const eased = 0.5 - Math.cos(elapsed * Math.PI * 2) / 2;
      pointerX += (targetX - pointerX) * 0.045;
      pointerY += (targetY - pointerY) * 0.045;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#507593");
      gradient.addColorStop(1, "#022E4A");
      context.fillStyle = gradient;
      roundedRect(0, 0, width, height, 26);
      context.fill();

      context.save();
      context.translate(pointerX * 9, pointerY * 9);
      context.strokeStyle = "rgba(226,216,203,.52)";
      context.lineWidth = 2;
      roundedRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84, 2);
      context.stroke();
      context.beginPath();
      context.moveTo(width * 0.08, height * 0.5);
      context.lineTo(width * 0.92, height * 0.5);
      context.moveTo(width * 0.5, height * 0.08);
      context.lineTo(width * 0.5, height * 0.92);
      context.moveTo(width * 0.28, height * 0.08);
      context.lineTo(width * 0.28, height * 0.92);
      context.moveTo(width * 0.72, height * 0.08);
      context.lineTo(width * 0.72, height * 0.92);
      context.stroke();
      context.restore();

      context.strokeStyle = "rgba(226,216,203,.2)";
      context.setLineDash([6, 8]);
      context.beginPath();
      for (let point = 0; point <= 1; point += 0.02) {
        const x = width * (0.18 + point * 0.64);
        const y = height * (0.66 - Math.sin(point * Math.PI) * 0.48);
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.setLineDash([]);

      drawRacket(width * 0.18 + pointerX * 10, height * 0.62 + pointerY * 7, -0.48, "#E2D8CB", 0.92);
      drawRacket(width * 0.82 - pointerX * 10, height * 0.39 - pointerY * 7, 2.42, "#E2D8CB", 0.62);

      const progress = eased;
      const shuttleX = width * (0.18 + progress * 0.64);
      const shuttleY = height * (0.66 - Math.sin(progress * Math.PI) * 0.48);
      drawShuttle(shuttleX, shuttleY, progress * 2.4 - 0.5, 0.85 + Math.sin(progress * Math.PI) * 0.2);

      context.fillStyle = "rgba(226,216,203,.86)";
      context.font = "700 11px 'Segoe UI', sans-serif";
      context.letterSpacing = "2px";
      context.fillText("PLAY · CONNECT · IMPROVE", 24, height - 24);

      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    wrapper.addEventListener("pointermove", onPointerMove);
    wrapper.addEventListener("pointerleave", onPointerLeave);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="kinetic-court" aria-label="Animasi shuttlecock melintasi lapangan badminton">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="kinetic-court-label"><span /> Gerak cepat, koneksi tepat</div>
    </div>
  );
}
