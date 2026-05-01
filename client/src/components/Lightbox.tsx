import { useEffect, useCallback, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, ChevronsLeft, ChevronsRight } from "lucide-react";

export type LightboxItem = { url: string; label?: string };

interface Props {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNav: (index: number) => void;
  sectionTitle?: string;
  onPrevSection?: () => void;
  onNextSection?: () => void;
}

function isYoutube(url: string) { return /youtube\.com|youtu\.be/.test(url); }
function youtubeEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export function Lightbox({ items, index, onClose, onNav, sectionTitle, onPrevSection, onNextSection }: Props) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const isYT = item ? isYoutube(item.url) : false;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const prev = useCallback(() => { if (hasPrev) { onNav(index - 1); resetView(); } }, [hasPrev, index, onNav, resetView]);
  const next = useCallback(() => { if (hasNext) { onNav(index + 1); resetView(); } }, [hasNext, index, onNav, resetView]);
  const zoomIn  = useCallback(() => setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; }), []);

  useEffect(() => { resetView(); }, [index]);

  // Lock body scroll while lightbox open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Non-passive wheel to prevent page scroll during zoom
  useEffect(() => {
    if (isYT) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY < 0) setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
      else setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz; });
    }
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isYT]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && zoom === 1) prev();
      if (e.key === "ArrowRight" && zoom === 1) next();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetView();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, zoomIn, zoomOut, resetView, zoom]);

  function onWheel(_e: React.WheelEvent) { /* handled by native listener */ }

  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  }

  function onMouseUp() { dragging.current = false; }

  // Touch drag
  function onTouchStart(e: React.TouchEvent) {
    if (zoom <= 1 || e.touches.length !== 1) return;
    const t = e.touches[0];
    dragging.current = true;
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pan.x, py: pan.y };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPan({
      x: dragStart.current.px + (t.clientX - dragStart.current.mx),
      y: dragStart.current.py + (t.clientY - dragStart.current.my),
    });
  }

  function onTouchEnd() { dragging.current = false; }

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1">
          {!isYT && (
            <>
              <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} disabled={zoom <= MIN_ZOOM}
                className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-white/50 text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} disabled={zoom >= MAX_ZOOM}
                className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30">
                <ZoomIn className="h-4 w-4" />
              </button>
              {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                <button onClick={(e) => { e.stopPropagation(); resetView(); }}
                  className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
        <button className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Prev photo */}
      {hasPrev && (
        <button className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all rounded"
          onClick={(e) => { e.stopPropagation(); prev(); }}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Prev section */}
      {onPrevSection && (
        <button
          className="absolute left-3 z-10 h-11 w-11 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all rounded"
          style={{ top: "calc(50% + 56px)" }}
          title="Previous project/event"
          onClick={(e) => { e.stopPropagation(); onPrevSection(); }}>
          <ChevronsLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next photo */}
      {hasNext && (
        <button className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all rounded"
          onClick={(e) => { e.stopPropagation(); next(); }}>
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Next section */}
      {onNextSection && (
        <button
          className="absolute right-3 z-10 h-11 w-11 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all rounded"
          style={{ top: "calc(50% + 56px)" }}
          title="Next project/event"
          onClick={(e) => { e.stopPropagation(); onNextSection(); }}>
          <ChevronsRight className="h-6 w-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="max-w-5xl w-full px-16 flex items-center justify-center overflow-hidden"
        style={{ maxHeight: "90vh", userSelect: "none" }}
        onClick={(e) => e.stopPropagation()}
        onWheel={!isYT ? onWheel : undefined}
        onMouseDown={!isYT ? onMouseDown : undefined}
        onMouseMove={!isYT ? onMouseMove : undefined}
        onMouseUp={!isYT ? onMouseUp : undefined}
        onMouseLeave={!isYT ? onMouseUp : undefined}
        onTouchStart={!isYT ? onTouchStart : undefined}
        onTouchMove={!isYT ? onTouchMove : undefined}
        onTouchEnd={!isYT ? onTouchEnd : undefined}
      >
        {isYT ? (
          <div className="relative w-full aspect-video">
            <iframe src={youtubeEmbed(item.url)} className="w-full h-full rounded" allow="autoplay; fullscreen" allowFullScreen />
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.label || ""}
            draggable={false}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
              transition: dragging.current ? "none" : "transform 0.15s ease",
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
              cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "default",
            }}
          />
        )}
      </div>

      {/* Bottom counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
        {sectionTitle && <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{sectionTitle}</p>}
        {item.label && sectionTitle !== item.label && <p className="text-white/40 text-xs uppercase tracking-wider">{item.label}</p>}
        <p className="text-white/30 text-[10px] tabular-nums">{index + 1} / {items.length}</p>
        {!isYT && zoom === 1 && <p className="text-white/20 text-[10px]">scroll to zoom · drag to pan · ← → navigate</p>}
      </div>
    </div>
  );
}
