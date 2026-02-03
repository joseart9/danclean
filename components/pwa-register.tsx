"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";
const SW_SCOPE = "/";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function registerServiceWorker(retryCount = 0): Promise<ServiceWorkerRegistration | void> {
  return navigator.serviceWorker
    .register(SW_URL, { scope: SW_SCOPE })
    .then((reg) => {
      reg.update();
      return reg;
    })
    .catch(() => {
      if (retryCount < MAX_RETRIES) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            registerServiceWorker(retryCount + 1).then(() => resolve());
          }, RETRY_DELAY_MS);
        });
      }
    });
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    registerServiceWorker();

    // Samsung Internet: re-check when user returns to the tab so install badge can appear
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration(SW_SCOPE).then((reg) => {
          if (reg) reg.update();
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return null;
}
