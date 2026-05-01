import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function useRouteLoader() {
  const [location] = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsRouteLoading(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);

    // Give it time to feel intentional; auto-hide even if data loads fast.
    timerRef.current = window.setTimeout(() => setIsRouteLoading(false), 650);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [location]);

  return { isRouteLoading, finish: () => setIsRouteLoading(false) };
}
