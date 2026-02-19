"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Simple external store for navigation progress state
let navigating = false;
let progress = 0;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getNavigating() {
  return navigating;
}

function getProgress() {
  return progress;
}

function setNav(val: boolean) {
  navigating = val;
  emitChange();
}

function setProg(val: number) {
  progress = val;
  emitChange();
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevUrlRef = useRef(pathname + searchParams.toString());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNavigating = useSyncExternalStore(subscribe, getNavigating, () => false);
  const currentProgress = useSyncExternalStore(subscribe, getProgress, () => 0);

  const startProgress = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setNav(true);
    setProg(0);
    if (timerRef.current) clearInterval(timerRef.current);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 15;
      if (p > 90) p = 90;
      setProg(p);
    }, 200);
  }, []);

  useEffect(() => {
    const currentUrl = pathname + searchParams.toString();
    if (currentUrl !== prevUrlRef.current) {
      // Navigation completed
      if (timerRef.current) clearInterval(timerRef.current);
      setProg(100);
      hideTimerRef.current = setTimeout(() => {
        setNav(false);
        setProg(0);
      }, 200);
      prevUrlRef.current = currentUrl;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.download ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      )
        return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      const currentUrl = pathname + "?" + searchParams.toString();
      const [path, qs] = href.split("?");
      const nextUrl = path + "?" + (qs || "");

      if (currentUrl !== nextUrl) {
        startProgress();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams, startProgress]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${currentProgress}%` }}
      />
    </div>
  );
}
