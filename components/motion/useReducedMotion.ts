"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const preference = window.matchMedia(query);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

// Keep server output still until the browser's preference is available.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
