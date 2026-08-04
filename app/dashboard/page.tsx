import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  caseStatuses,
  formatCurrency,
  formatDate,
  getCaseStatus,
  type CaseStatus
} from "@/lib/cases";
import {
  caseTypes,
  getCaseTypeByValue,
  type CaseTypeValue
} from "@/lib/case-types";

type DashboardCase = {
  id: string;
  type: CaseTypeValue;
  status: CaseStatus;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  currency: string;
  updated_at: string | Date;
  next_due_at: string | Date | null;
};

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    scope?: string;
    sort?: string;
    notice?: string;
  }>;
};

type Scope = "active" | "archived" | "all";
type SortMode = "updated_desc" | "updated_asc" | "amount_desc" | "amount_asc" | "deadline_asc" | "deadline_desc";

const scopes: { value: Scope; label: string }[] = [
  { value: "active", label: "Aktiv" },
  { value: "archived", label: "Archiv" },
  { value: "all", label: "Alle" }
];

const sortModes: { value: SortMode; label: string }[] = [
  { value: "updated_desc", label: "Zuletzt geändert" },
  { value: "updated_asc", label: "Älteste Änderung" },
  { value: "amount_desc", label: "Betrag absteigend" },
  { value: "amount_asc", label: "Betrag aufsteigend" },
  { value: "deadline_asc", label: "Nächste Frist zuerst" },
  { value: "deadline_desc", label: "Späteste Frist zuerst" }
];

function timestamp(value: string | Date | null) {
  if (!value) {
    return null;
  }
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function compareNullableNumbers(a: number | null, b: number | null, direction: "asc" | "desc") {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function dashboardHref(
  current: { q: string; status: string; type: string; scope: Scope; sort: SortMode },
  changes: Partial<{ q: string; status: string; type: string; scope: Scope; sort: SortMode }>
) {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.type) params.set("type", next.type);
  if (next.scope !== "active") params.set("scope", next.scope);
  if (next.sort !== "updated_desc") params.set("sort", next.sort);
  const queryString = params.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const accountName = user.displayName || user.email;
  const raw = await searchParams;

  const q = (raw.q ?? "").trim().slice(0, 100);
  const selectedStatus = caseStatuses.some((item) => item.value === raw.status) ? raw.status ?? "" : "";
  const selectedType = caseTypes.some((item) => item.dbValue === raw.type) ? raw.type ?? "" : "";
  const scope: Scope = scopes.some((item) => item.value === raw.scope) ? raw.scope as Scope : "active";
  const sort: SortMode = sortModes.some((item) => item.value === raw.sort) ? raw.sort as SortMode : "updated_desc";

  const result = await query<DashboardCase>(
    `SELECT
       c.id,
       c.type,
       c.status,
       c.title,
       c.company_name,
       c.order_reference,
       c.amount_cents,
       c.currency,
       c.updated_at,
       (
         SELECT MIN(d.due_at)
         FROM case_deadlines d
         WHERE d.case_id = c.id
           AND d.completed_at IS NULL
       ) AS next_due_at
     FROM cases c
     WHERE c.user_id = $1`,
    [user.id]
  );

  const allCases = result.rows;
  const activeCases = allCases.filter((item) => !["resolved", "closed"].includes(item.status));
  const archivedCount = allCases.filter((item) => item.status === "closed").length;
  const openAmount = activeCases.reduce((sum, item) => sum + (item.amount_cents ?? 0), 0);
  const nextDeadline = activeCases
    .map((item) => item.next_due_at)
    .filter((value): value is string | Date => Boolean(value))
    .sort((a, b) => (timestamp(a) ?? Number.MAX_SAFE_INTEGER) - (timestamp(b) ?? Number.MAX_SAFE_INTEGER))[0] ?? null;

  const normalizedQuery = q.toLocaleLowerCase("de-DE");
  const visibleCases = allCases
    .filter((item) => {
      if (scope === "active" && item.status === "closed") return false;
      if (scope === "archived" && item.status !== "closed") return false;
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (selectedType && item.type !== selectedType) return false;

      if (normalizedQuery) {
        const haystack = [item.title, item.company_name, item.order_reference]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de-DE");
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "updated_asc":
          return compareNullableNumbers(timestamp(a.updated_at), timestamp(b.updated_at), "asc");
        case "amount_desc":
          return compareNullableNumbers(a.amount_cents, b.amount_cents, "desc");
        case "amount_asc":
          return compareNullableNumbers(a.amount_cents, b.amount_cents, "asc");
        case "deadline_asc":
          return compareNullableNumbers(timestamp(a.next_due_at), timestamp(b.next_due_at), "asc");
        case "deadline_desc":
          return compareNullableNumbers(timestamp(a.next_due_at), timestamp(b.next_due_at), "desc");
        case "updated_desc":
        default:
          return compareNullableNumbers(timestamp(a.updated_at), timestamp(b.updated_at), "desc");
      }
    });

  const filterState = { q, status: selectedStatus, type: selectedType, scope, sort };
  const hasFilters = Boolean(q || selectedStatus || selectedType || scope !== "active" || sort !== "updated_desc");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link className="active" href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <Link href="/fristen">Fristen</Link>
          <Link href="/dokumente">Dokumente</Link>
          <Link href="/einstellungen">Einstellungen</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Abmelden</button>
          </form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">Übersicht</span>
            <h1>Meine Fälle</h1>
            <p className="dashboard-welcome">Willkommen, {user.displayName || user.email}.</p>
          </div>
          <Link className="button button-primary" href="/neuer-fall">+ Neuer Fall</Link>
        </header>

        {raw.notice ? <div className="notice-card dashboard-notice" role="status"><strong>{raw.notice}</strong></div> : null}

        <div className="stats-grid">
          <div className="stat-card">
            <span>Aktive Fälle</span>
            <strong>{activeCases.length}</strong>
            <small>{archivedCount} archiviert · {allCases.length} insgesamt</small>
          </div>
          <div className="stat-card">
            <span>Offener Betrag</span>
            <strong>{formatCurrency(openAmount)}</strong>
            <small>über aktive Fälle</small>
          </div>
          <div className="stat-card">
            <span>Nächste Frist</span>
            <strong>{nextDeadline ? formatDate(nextDeadline) : "Keine"}</strong>
            <small>{nextDeadline ? "offene Frist" : "noch keine Frist erfasst"}</small>
          </div>
        </div>

        <section className="dashboard-tools panel">
          <div className="dashboard-scope-tabs" aria-label="Fallansicht">
            {scopes.map((item) => (
              <Link
                className={scope === item.value ? "active" : ""}
                href={dashboardHref(filterState, { scope: item.value })}
                key={item.value}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <form className="dashboard-filter-form" action="/dashboard" method="get">
            <input name="scope" type="hidden" value={scope} />
            <label className="dashboard-search-field">
              <span>Suche</span>
              <input name="q" type="search" defaultValue={q} placeholder="Titel, Anbieter oder Referenz" maxLength={100} />
            </label>
            <label>
              <span>Status</span>
              <select name="status" defaultValue={selectedStatus}>
                <option value="">Alle Status</option>
                {caseStatuses.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Fallart</span>
              <select name="type" defaultValue={selectedType}>
                <option value="">Alle Fallarten</option>
                {caseTypes.map((item) => <option value={item.dbValue} key={item.dbValue}>{item.title}</option>)}
              </select>
            </label>
            <label>
              <span>Sortierung</span>
              <select name="sort" defaultValue={sort}>
                {sortModes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <div className="dashboard-filter-actions">
              <button className="button button-primary" type="submit">Anwenden</button>
              {hasFilters ? <Link className="button button-secondary" href="/dashboard">Zurücksetzen</Link> : null}
            </div>
          </form>
        </section>

        <div className="panel dashboard-case-panel">
          <div className="panel-header">
            <h2>{scope === "archived" ? "Archivierte Fälle" : scope === "all" ? "Alle Fälle" : "Aktive Fälle"}</h2>
            <span>{visibleCases.length} von {allCases.length}</span>
          </div>

          {allCases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">+</div>
              <h3>Noch kein Fall angelegt</h3>
              <p>Lege deinen ersten Fall an und sammle Anbieter, Betrag, Chronik und Fristen an einem Ort.</p>
              <Link className="button button-primary" href="/neuer-fall">Ersten Fall anlegen</Link>
            </div>
          ) : visibleCases.length === 0 ? (
            <div className="empty-state dashboard-no-results">
              <div className="empty-state-icon">⌕</div>
              <h3>Keine passenden Fälle</h3>
              <p>Zu deiner Suche und den gewählten Filtern wurde kein Fall gefunden.</p>
              <Link className="button button-secondary" href="/dashboard">Suche und Filter löschen</Link>
            </div>
          ) : (
            <div className="case-list">
              {visibleCases.map((item) => {
                const status = getCaseStatus(item.status);
                const type = getCaseTypeByValue(item.type);

                return (
                  <Link className="case-row dashboard-case-row" href={`/faelle/${item.id}`} key={item.id}>
                    <div className="case-row-main">
                      <div className="case-avatar">{type?.icon ?? item.title.charAt(0)}</div>
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.company_name || type?.title || "Ohne Anbieter"}
                          {item.order_reference ? ` · ${item.order_reference}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="dashboard-case-meta">
                      <strong>{formatCurrency(item.amount_cents, item.currency)}</strong>
                      <small>{item.next_due_at ? `Frist: ${formatDate(item.next_due_at)}` : "Keine offene Frist"}</small>
                    </div>
                    <span className={`status status-${status.tone}`}>{status.label}</span>
                    <span className="case-row-arrow" aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
