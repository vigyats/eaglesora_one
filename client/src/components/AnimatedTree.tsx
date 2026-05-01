import { useEffect, useRef } from "react";

interface Leaf {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; opacity: number;
  color: string;
  wobble: number; wobbleSpeed: number;
}

const LEAF_COLORS = [
  "rgba(30,30,30,",
  "rgba(60,60,60,",
  "rgba(90,90,90,",
  "rgba(120,120,120,",
  "rgba(15,15,15,",
  "rgba(50,50,50,",
  "rgba(80,80,80,",
];

export function AnimatedTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const frameRef = useRef<number>(0);
  const treeDrawnRef = useRef<boolean>(false);
  const spawnPointsRef = useRef<{ x: number; y: number }[]>([]);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

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
      treeDrawnRef.current = false;
    };
    resize();
    window.addEventListener("resize", resize);

    function drawBranch(
      c: CanvasRenderingContext2D,
      x: number, y: number,
      angle: number, length: number, width: number,
      depth: number,
      tips: { x: number; y: number }[]
    ) {
      if (depth === 0 || length < 2) return;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      // single natural bark colour throughout
      const r = 62, g = 42, b = 22;

      c.save();
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(
        x + Math.cos(angle - 0.06) * length * 0.55,
        y + Math.sin(angle - 0.06) * length * 0.55,
        endX, endY
      );
      c.strokeStyle = `rgb(${r},${g},${b})`;
      c.lineWidth = Math.max(width, 0.5);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.stroke();

      // subtle highlight for roundness
      if (width > 2) {
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(
          x + Math.cos(angle - 0.06) * length * 0.55,
          y + Math.sin(angle - 0.06) * length * 0.55,
          endX, endY
        );
        c.strokeStyle = `rgba(${r + 35},${g + 24},${b + 12},0.22)`;
        c.lineWidth = Math.max(width * 0.3, 0.5);
        c.stroke();
      }
      c.restore();
      if (depth <= 5) {
        tips.push({ x: endX, y: endY });
        const leafCount = depth === 1 ? 14 : depth === 2 ? 10 : depth === 3 ? 7 : depth === 4 ? 5 : 3;
        for (let i = 0; i < leafCount; i++) {
          const la = angle + (Math.random() - 0.5) * 3.0;
          const lr = Math.random() * length * 1.0 + 6;
          const lx = endX + Math.cos(la) * lr;
          const ly = endY + Math.sin(la) * lr;
          const ls = Math.random() * 14 + 7;
          const green = Math.floor(Math.random() * 40 + 80);
          c.save();
          c.globalAlpha = Math.random() * 0.3 + 0.6;
          c.fillStyle = `rgb(${green},${green},${green})`;
          c.beginPath();
          c.ellipse(lx, ly, ls * 1.5, ls * 0.95, la + Math.PI / 4, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
      }
      const spread = 0.38 + depth * 0.018;
      const lenRatio = 0.68 + Math.random() * 0.06;
      drawBranch(c, endX, endY, angle - spread, length * lenRatio, width * 0.80, depth - 1, tips);
      drawBranch(c, endX, endY, angle + spread, length * (lenRatio - 0.04), width * 0.78, depth - 1, tips);
      if (depth > 4 && Math.random() > 0.55) {
        drawBranch(c, endX, endY, angle + (Math.random() - 0.5) * 0.3, length * 0.55, width * 0.68, depth - 2, tips);
      }
    }

    function buildStaticTree(W: number, H: number) {
      const off = document.createElement("canvas");
      off.width = W * dpr;
      off.height = H * dpr;
      const octx = off.getContext("2d", { alpha: true })!;
      octx.scale(dpr, dpr);
      spawnPointsRef.current = [];
      // trunk width scales with the smaller of W/H so mobile looks right
      const trunkW = Math.min(W, H) * 0.072;
      drawBranch(octx, W * 0.82, H * 0.98, -Math.PI / 2, H * 0.32, trunkW, 12, spawnPointsRef.current);
      const sg = octx.createRadialGradient(W * 0.82, H * 0.98, 0, W * 0.82, H * 0.98, W * 0.22);
      sg.addColorStop(0, "rgba(0,0,0,0.06)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      octx.fillStyle = sg;
      octx.beginPath();
      octx.ellipse(W * 0.82, H * 0.98, W * 0.22, H * 0.025, 0, 0, Math.PI * 2);
      octx.fill();
      offscreenRef.current = off;
      treeDrawnRef.current = true;
    }

    function drawLeafShape(c: CanvasRenderingContext2D, leaf: Leaf) {
      c.save();
      c.translate(leaf.x, leaf.y);
      c.rotate(leaf.rotation);
      c.globalAlpha = leaf.opacity;
      c.fillStyle = leaf.color + leaf.opacity + ")";
      c.beginPath();
      c.moveTo(0, -leaf.size);
      c.bezierCurveTo(leaf.size * 0.7, -leaf.size * 0.6, leaf.size * 0.8, leaf.size * 0.2, 0, leaf.size * 0.5);
      c.bezierCurveTo(-leaf.size * 0.8, leaf.size * 0.2, -leaf.size * 0.7, -leaf.size * 0.6, 0, -leaf.size);
      c.fill();
      c.strokeStyle = leaf.color + (leaf.opacity * 0.35) + ")";
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, -leaf.size * 0.8);
      c.lineTo(0, leaf.size * 0.4);
      c.stroke();
      c.restore();
    }

    function spawnLeaf(W: number, H: number): Leaf {
      const pts = spawnPointsRef.current;
      let sx: number, sy: number;
      if (pts.length > 0) {
        const pt = pts[Math.floor(Math.random() * pts.length)];
        sx = pt.x + (Math.random() - 0.5) * 30;
        sy = pt.y + (Math.random() - 0.5) * 20;
      } else {
        sx = W * 0.3 + Math.random() * W * 0.4;
        sy = H * 0.1 + Math.random() * H * 0.3;
      }
      return {
        x: sx, y: sy,
        vx: (Math.random() - 0.75) * 1.4,
        vy: Math.random() * 0.6 + 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        size: Math.random() * 6 + 4,
        opacity: Math.random() * 0.4 + 0.55,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.018 + 0.006,
      };
    }

    const W0 = canvas.offsetWidth;
    const H0 = canvas.offsetHeight;
    buildStaticTree(W0, H0);
    for (let i = 0; i < 20; i++) {
      const l = spawnLeaf(W0, H0);
      l.y = Math.random() * H0;
      leavesRef.current.push(l);
    }

    function animate() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!treeDrawnRef.current) buildStaticTree(W, H);
      ctx.clearRect(0, 0, W, H);
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0, W, H);
      if (Math.random() < 0.07 && leavesRef.current.length < 70) {
        leavesRef.current.push(spawnLeaf(W, H));
      }
      leavesRef.current = leavesRef.current.filter((leaf) => {
        leaf.wobble += leaf.wobbleSpeed;
        leaf.x += leaf.vx + Math.sin(leaf.wobble) * 0.7 - 0.3;
        leaf.y += leaf.vy;
        leaf.rotation += leaf.rotSpeed;
        leaf.vy += 0.006;
        leaf.opacity -= 0.001;
        drawLeafShape(ctx, leaf);
        return leaf.y < H + 30 && leaf.opacity > 0.04;
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
      className="absolute inset-0 w-full h-full"
      style={{ display: "block", background: "transparent" }}
    />
  );
}
