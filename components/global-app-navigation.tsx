"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localizedPath, type Locale } from "@/lib/i18n-shared";

type NavigationState = {
  authenticated: boolean;
  onboardingOpen?: boolean;
  planCode?: "free" | "pro";
  admin?: boolean;
};

export function GlobalAppNavigation({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/navigation-state", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<NavigationState> : { authenticated: false } as NavigationState)
      .then((value) => { if (!cancelled) setState(value); })
      .catch(() => { if (!cancelled) setState({ authenticated: false }); });
    return () => { cancelled = true; };
  }, [pathname]);

  if (!state?.authenticated) return null;

  return (
    <nav className="global-app-navigation" aria-label={locale === "en" ? "Quick navigation" : "Schnellnavigation"}>
      <Link className={pathname.endsWith("/dashboard") ? "active" : undefined} href={localizedPath("/dashboard", locale)}>{locale === "en" ? "Cases" : "Fälle"}</Link>
      {state.onboardingOpen ? <Link className={pathname.endsWith("/onboarding") ? "active onboarding-open" : "onboarding-open"} href={localizedPath("/onboarding", locale)}>Onboarding</Link> : null}
      <Link className={pathname.endsWith("/hilfe") ? "active" : undefined} href={localizedPath("/hilfe", locale)}>{locale === "en" ? "Help" : "Hilfe"}</Link>
      <Link className={pathname.includes("/preise") ? "active" : undefined} href={localizedPath("/preise", locale)}>{state.planCode === "pro" ? "Pro" : "Upgrade"}</Link>
      {state.admin ? <Link className={pathname.includes("/admin") ? "active admin-link" : "admin-link"} href={localizedPath("/admin", locale)}>Admin</Link> : null}
      <Link className={pathname.endsWith("/einstellungen") ? "active" : undefined} href={localizedPath("/einstellungen", locale)}>{locale === "en" ? "Account" : "Konto"}</Link>
    </nav>
  );
}
