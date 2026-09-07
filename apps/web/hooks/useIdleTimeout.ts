"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export function useIdleTimeout(timeoutMinutes: number = 15) {
  const { status } = useSession();

  useEffect(() => {
    // Only run the idle timer if the user is actively logged in
    if (status !== "authenticated") return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Automatically sign out after 'timeoutMinutes' of inactivity
        signOut({ callbackUrl: "/landing" });
      }, timeoutMinutes * 60 * 1000);
    };

    // Listen for activity events to reset the timer
    const events = ["mousemove", "keydown", "wheel", "touchstart", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer initially
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [status, timeoutMinutes]);
}
