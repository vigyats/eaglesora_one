import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  pulse: number; pulseSpeed: number;
}

export function AnimatedHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // ── Particles (community nodes) ──────────────────────────
    const COUNT = 55;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2.5 + 1.2,
      opacity: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.008,
    }));

    // ── Rising light orb ─────────────────────────────────────
    let orbY = H() * 0.75;
    let orbT = 0;

    // ── Ripple rings ─────────────────────────────────────────
    interface Ring { x: number; y: number; r: number; maxR: number; alpha: number; }
    const rings: Ring[] = [];
    let ringTimer = 0;

    function spawnRing() {
      const p = particles[Math.floor(Math.random() * particles.length)];
      rings.push({ x: p.x, y: p.y, r: 0, maxR: 40 + Math.random() * 30, alpha: 0.5 });
    }

    // ── Floating text labels ──────────────────────────────────
    interface Label { x: number; y: number; vy: number; text: string; alpha: number; }
    const WORDS = ["Community", "Service", "Unity", "Growth", "Hope", "Action", "Change", "Together"];
    const labels: Label[] = WORDS.map((text, i) => ({
      x: W() * (0.55 + (i % 4) * 0.12),
      y: H() * (0.2 + Math.floor(i / 4) * 0.35 + Math.random() * 0.1),
      vy: -(Math.random() * 0.18 + 0.08),
      text,
      alpha: Math.random() * 0.18 + 0.08,
    }));

    function draw() {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      orbT += 0.008;
      orbY = h * 0.72 + Math.sin(orbT * 0.6) * h * 0.04;

      // ── Rising light orb glow ──
      const orbX = w * 0.78;
      const grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, w * 0.38);
      grad.addColorStop(0,   "rgba(255,160,40,0.13)");
      grad.addColorStop(0.4, "rgba(255,120,20,0.06)");
      grad.addColorStop(1,   "rgba(255,100,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, w * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // ── Bottom ground glow ──
      const groundGrad = ctx.createLinearGradient(0, h * 0.85, 0, h);
      groundGrad.addColorStop(0, "rgba(200,120,30,0.06)");
      groundGrad.addColorStop(1, "rgba(200,120,30,0)");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // ── Connection lines between nearby particles ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w * 0.14;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(180,100,30,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // ── Particles ──
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const r = p.radius + Math.sin(p.pulse) * 0.8;
        const alpha = p.opacity + Math.sin(p.pulse) * 0.12;

        // outer glow
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        pg.addColorStop(0, `rgba(200,110,30,${alpha * 0.4})`);
        pg.addColorStop(1, "rgba(200,110,30,0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,80,20,${alpha})`;
        ctx.fill();
      }

      // ── Ripple rings ──
      ringTimer++;
      if (ringTimer % 90 === 0) spawnRing();
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += 0.6;
        ring.alpha -= 0.006;
        if (ring.alpha <= 0) { rings.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,110,30,${ring.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Floating word labels ──
      ctx.textAlign = "left";
      for (const lb of labels) {
        lb.y += lb.vy;
        if (lb.y < -20) {
          lb.y = h + 10;
          lb.x = w * 0.52 + Math.random() * w * 0.44;
          lb.alpha = Math.random() * 0.18 + 0.06;
        }
        ctx.font = `${Math.round(w * 0.012 + 9)}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(120,60,10,${lb.alpha})`;
        ctx.fillText(lb.text, lb.x, lb.y);
      }

      // ── Subtle wave at bottom ──
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = h - 18 + Math.sin((x / w) * Math.PI * 3 + orbT * 2) * 6
                       + Math.sin((x / w) * Math.PI * 5 + orbT * 1.3) * 3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "rgba(180,100,30,0.07)";
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block", background: "transparent" }}
    />
  );
}
