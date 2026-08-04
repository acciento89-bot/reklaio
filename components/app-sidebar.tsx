import Link from "next/link";
import type { AuthUser } from "@/lib/auth";
import { getBillingAccount } from "@/lib/billing";
import { query } from "@/lib/db";

type ActiveItem = "dashboard" | "new" | "deadlines" | "documents" | "settings" | "help" | "pricing" | "onboarding";

type AppSidebarProps = {
  user: AuthUser;
  active: ActiveItem;
};

const baseItems = [
  { key: "dashboard", href: "/dashboard", label: "Meine Fälle" },
  { key: "new", href: "/neuer-fall", label: "Neuer Fall" },
  { key: "deadlines", href: "/fristen", label: "Fristen" },
  { key: "documents", href: "/dokumente", label: "Dokumente" },
  { key: "help", href: "/hilfe", label: "Hilfe" },
  { key: "pricing", href: "/preise", label: "Tarif & Pro" },
  { key: "settings", href: "/einstellungen", label: "Einstellungen" }
] as const;

export async function AppSidebar({ user, active }: AppSidebarProps) {
  const [onboardingResult, billing] = await Promise.all([
    query<{ onboarding_completed_at: string | null }>(
      `SELECT onboarding_completed_at FROM app_users WHERE id = $1 LIMIT 1`,
      [user.id]
    ),
    getBillingAccount(user.id)
  ]);

  const showOnboarding = !onboardingResult.rows[0]?.onboarding_completed_at;
  const items = showOnboarding
    ? [
        ...baseItems.slice(0, 4),
        { key: "onboarding" as const, href: "/onboarding", label: "Onboarding" },
        ...baseItems.slice(4)
      ]
    : [...baseItems];

  const accountName = user.displayName || user.email;

  return (
    <>
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          {items.map((item) => (
            <Link className={active === item.key ? "active" : undefined} href={item.href} key={item.key}>
              {item.label}
              {item.key === "onboarding" ? <small>Offen</small> : null}
            </Link>
          ))}
        </nav>
        <div className="sidebar-plan">
          <span>Tarif</span>
          <strong>{billing.planCode === "pro" ? "Reklaio Pro" : "Reklaio Free"}</strong>
          {billing.subscriptionStatus === "beta" ? <small>Beta-Zugang</small> : null}
        </div>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post"><button type="submit">Abmelden</button></form>
        </div>
      </aside>

      <nav className="mobile-app-nav" aria-label="App-Navigation">
        <Link className={active === "dashboard" ? "active" : undefined} href="/dashboard">Fälle</Link>
        <Link className={active === "deadlines" ? "active" : undefined} href="/fristen">Fristen</Link>
        {showOnboarding ? <Link className={active === "onboarding" ? "active onboarding-open" : "onboarding-open"} href="/onboarding">Start</Link> : null}
        <Link className={active === "help" ? "active" : undefined} href="/hilfe">Hilfe</Link>
        <Link className={active === "settings" ? "active" : undefined} href="/einstellungen">Konto</Link>
      </nav>
    </>
  );
}
