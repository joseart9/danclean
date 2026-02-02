"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Optional: check for updates
        reg.update();
      })
      .catch(() => {
        // Registration failed; install may still work in some browsers
      });
  }, []);
  return null;
}
