import { useEffect, useRef } from "react";

interface Leaf {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; opacity: number;
  wobble: number; wobbleSpeed: number;
  color: string;
}

const COLORS = [
  "rgba(80,45,10,",
  "rgba(100,60,15,",
  "rgba(60,35,8,",
  "rgba(120,70,20,",
  "rgba(90,50,12,",
];

export function LeafAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const leavesRef = useRef<Leaf[]>([]);

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

    function spawnLeaf(): Leaf {
      return {
        x: -20,
        y: Math.random() * H() * 0.85 + H() * 0.05,
        vx: Math.random() * 1.2 + 0.6,
        vy: Math.random() * 0.4 - 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        size: Math.random() * 10 + 7,
        opacity: Math.random() * 0.35 + 0.25,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.022 + 0.008,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    // seed initial leaves spread across screen
    for (let i = 0; i < 18; i++) {
      const l = spawnLeaf();
      l.x = Math.random() * W();
      leavesRef.current.push(l);
    }

    function drawLeaf(c: CanvasRenderingContext2D, leaf: Leaf) {
      c.save();
      c.translate(leaf.x, leaf.y);
      c.rotate(leaf.rotation);
      c.globalAlpha = leaf.opacity;
      c.fillStyle = leaf.color + leaf.opacity + ")";

      // leaf shape
      c.beginPath();
      c.moveTo(0, -leaf.size);
      c.bezierCurveTo(leaf.size * 0.8, -leaf.size * 0.5, leaf.size * 0.9, leaf.size * 0.3, 0, leaf.size * 0.6);
      c.bezierCurveTo(-leaf.size * 0.9, leaf.size * 0.3, -leaf.size * 0.8, -leaf.size * 0.5, 0, -leaf.size);
      c.fill();

      // midrib
      c.strokeStyle = leaf.color + (leaf.opacity * 0.5) + ")";
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(0, -leaf.size * 0.85);
      c.lineTo(0, leaf.size * 0.5);
      c.stroke();

      c.restore();
    }

    let spawnTimer = 0;

    function animate() {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      spawnTimer++;
      if (spawnTimer % 55 === 0 && leavesRef.current.length < 35) {
        leavesRef.current.push(spawnLeaf());
      }

      leavesRef.current = leavesRef.current.filter((leaf) => {
        leaf.wobble += leaf.wobbleSpeed;
        leaf.x += leaf.vx;
        leaf.y += leaf.vy + Math.sin(leaf.wobble) * 0.5;
        leaf.rotation += leaf.rotSpeed;
        leaf.vy += 0.003;

        drawLeaf(ctx, leaf);
        return leaf.x < w + 30;
      });

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: "block", background: "transparent" }}
    />
  );
}
