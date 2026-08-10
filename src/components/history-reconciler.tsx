"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { reconcileHistory } from "@/app/actions";

/**
 * Fills in runs that ended while nobody was watching.
 *
 * This is a mount effect rather than something the page does while rendering,
 * and that's deliberate: writing to the database during a render makes the page
 * uncacheable and runs again on every React retry. Rendering stays a read; the
 * catching-up is a mutation, fired once the page is on screen.
 *
 * Renders nothing. Only mounted when something is actually pending.
 */
export function HistoryReconciler() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    reconcileHistory()
      .then(() => {
        if (!cancelled) router.refresh();
      })
      .catch(() => {
        // Nothing to say. The rows still read "Scoring…" and the next visit
        // tries again.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
