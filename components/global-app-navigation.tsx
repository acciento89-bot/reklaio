"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavigationState = {
  authenticated: boolean;
  onboardingOpen?: boolean;
  planCode?: "free" | "pro";
};

export function GlobalAppNavigation() {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/navigation-state", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { authenticated: false } as NavigationState;
        return response.json() as Promise<NavigationState>;
      })
      .then((value) => {
        if (!cancelled) setState(value);
      })
      .catch(() => {
        if (!cancelled) setState({ authenticated: false });
      });

    return () => { cancelled = true; };
  }, [pathname]);

  if (!state?.authenticated) return null;

  return (
    <nav className="global-app-navigation" aria-label="Schnellnavigation">
      <Link className={pathname === "/dashboard" ? "active" : undefined} href="/dashboard">Fälle</Link>
      {state.onboardingOpen ? (
        <Link className={pathname === "/onboarding" ? "active onboarding-open" : "onboarding-open"} href="/onboarding">
          Onboarding
        </Link>
      ) : null}
      <Link className={pathname === "/hilfe" ? "active" : undefined} href="/hilfe">Hilfe</Link>
      <Link className={pathname === "/preise" ? "active" : undefined} href="/preise">
        {state.planCode === "pro" ? "Pro" : "Upgrade"}
      </Link>
      <Link className={pathname === "/einstellungen" ? "active" : undefined} href="/einstellungen">Konto</Link>
    </nav>
  );
}
