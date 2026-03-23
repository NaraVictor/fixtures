"use client";

import { useEffect } from "react";

export function ScrollToMatchesOnHash() {
  useEffect(() => {
    const go = () => {
      if (window.location.hash !== "#matches") return;
      requestAnimationFrame(() => {
        document.getElementById("matches")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
