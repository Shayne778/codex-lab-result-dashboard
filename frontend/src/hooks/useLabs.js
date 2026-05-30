import { useEffect, useState } from "react";
import { mockLabs } from "../data/mockLabs";

export function useLabs() {
  const [labs, setLabs] = useState(mockLabs);

  useEffect(() => {
    let cancelled = false;

    async function loadPrivateLabs() {
      if (!import.meta.env.DEV) return;

      try {
        const response = await fetch("/private/liveLabs.json", { cache: "no-store" });
        if (!response.ok) return;
        const privateLabs = await response.json();
        if (!cancelled && Array.isArray(privateLabs) && privateLabs.length) {
          setLabs(privateLabs);
        }
      } catch {
        // Local private data is optional; GitHub Pages uses mock data.
      }
    }

    loadPrivateLabs();
    return () => {
      cancelled = true;
    };
  }, []);

  return labs;
}
