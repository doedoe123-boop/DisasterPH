"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/notifications";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
