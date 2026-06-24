"use client";

import { useEffect, useState } from "react";

export function ScreenshotBlocker() {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const block = (event: Event) => {
      event.preventDefault();
      setCovered(true);
      window.setTimeout(() => setCovered(false), 1800);
    };
    const keydown = (event: KeyboardEvent) => {
      const key = String(event.key || "").toLowerCase();
      if (key === "printscreen" || (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(key))) block(event);
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);

  return covered ? <div className="fixed inset-0 z-[9999] grid place-items-center bg-background text-sm font-medium">Screen capture is disabled</div> : null;
}
