import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  caseStatuses,
  formatCurrency,
  formatDate,
  formatDateTime,
  getLocalizedCaseStatus,
  type CaseStatus
} from "@/lib/cases";
import {
  caseTypes,
  getLocalizedCaseTypeByValue,
  getLocalizedCaseTypes,
  type CaseTypeValue
} from "@/lib/case-types";
import { assistantPriorityRank, getCaseAssistant } from "@/lib/case-assistant";
import { CaseTypeIcon } from "@/components/case-type-icon";
import { getProviderOutcome, getTaskPriority } from "@/lib/workflow";
import { getLocale, localizedPath, type Locale } from "@/lib/i18n";

type DashboardCase = {
  id: string;
  type: CaseTypeValue;
  status: CaseStatus;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  currency: string;
  incident_date: string | Date | null;
  summary: string | null;
  updated_at: string | Date;
  next_due_at: string | Date | null;
  document_count: number;
  event_count: number;
  open_deadline_count: number;
  letter_count: number;
};

type DashboardTask = {
  id: string;
  case_id: string;
  title: string;
  priority: string;
  due_at: string | Date | null;
  due_state: "overdue" | "today" | "open";
  case_title: string;
};

type ProviderPromise = {
  id: string;
  case_id: string;
  case_title: string;
  outcome: string;
  promised_amount_cents: number | null;
  promised_due_at: string | Date;
};

type DashboardPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    scope?: string;
    sort?: string;
    notice?: string;
    error?: string;
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
  if (!value) return null;
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
  changes: Partial<{ q: string; status: string; type: string; scope: Scope; sort: SortMode }>,
  locale: Locale
) {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.type) params.set("type", next.type);
  if (next.scope !== "active") params.set("scope", next.scope);
  if (next.sort !== "updated_desc") params.set("sort", next.sort);
  const queryString = params.toString();
  const path = localizedPath("/dashboard", locale);
  return queryString ? `${path}?${queryString}` : path;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const numberLocale = en ? "en-GB" : "de-DE";
  const localizedTypes = getLocalizedCaseTypes(locale);
  const localizedScopes = en ? [{ value: "active", label: "Active" }, { value: "archived", label: "Archive" }, { value: "all", label: "All" }] as const : scopes;
  const localizedSortModes = en ? [{ value: "updated_desc", label: "Recently updated" }, { value: "updated_asc", label: "Oldest update" }, { value: "amount_desc", label: "Amount descending" }, { value: "amount_asc", label: "Amount ascending" }, { value: "deadline_asc", label: "Next deadline first" }, { value: "deadline_desc", label: "Latest deadline first" }] as const : sortModes;
  const user = await requireUser();
  const accountName = user.displayName || user.email;
  const raw = await searchParams;

  const q = (raw.q ?? "").trim().slice(0, 100);
  const selectedStatus = caseStatuses.some((item) => item.value === raw.status) ? raw.status ?? "" : "";
  const selectedType = caseTypes.some((item) => item.dbValue === raw.type) ? raw.type ?? "" : "";
  const scope: Scope = scopes.some((item) => item.value === raw.scope) ? raw.scope as Scope : "active";
  const sort: SortMode = sortModes.some((item) => item.value === raw.sort) ? raw.sort as SortMode : "updated_desc";

  const [caseResult, taskResult, promiseResult] = await Promise.all([
    query<DashboardCase>(
      `SELECT
         c.id, c.type, c.status, c.title, c.company_name, c.order_reference,
         c.amount_cents, c.currency, c.incident_date, c.summary, c.updated_at,
         (SELECT MIN(d.due_at) FROM case_deadlines d WHERE d.case_id = c.id AND d.completed_at IS NULL) AS next_due_at,
         (SELECT COUNT(*)::int FROM case_documents d WHERE d.case_id = c.id) AS document_count,
         (SELECT COUNT(*)::int FROM case_events e WHERE e.case_id = c.id) AS event_count,
         (SELECT COUNT(*)::int FROM case_deadlines d WHERE d.case_id = c.id AND d.completed_at IS NULL) AS open_deadline_count,
         (SELECT COUNT(*)::int FROM generated_letters l WHERE l.case_id = c.id) AS letter_count
       FROM cases c
       WHERE c.user_id = $1`,
      [user.id]
    ),
    query<DashboardTask>(
      `SELECT
         t.id, t.case_id, t.title, t.priority, t.due_at, c.title AS case_title,
         CASE
           WHEN t.due_at IS NOT NULL AND t.due_at < NOW() THEN 'overdue'
           WHEN t.due_at IS NOT NULL AND t.due_at < ((date_trunc('day', NOW() AT TIME ZONE 'Europe/Berlin') + interval '1 day') AT TIME ZONE 'Europe/Berlin') THEN 'today'
           ELSE 'open'
         END AS due_state
       FROM case_tasks t
       JOIN cases c ON c.id = t.case_id
       WHERE c.user_id = $1
         AND t.status = 'open'
         AND c.status NOT IN ('resolved', 'closed')
       ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC`,
      [user.id]
    ),
    query<ProviderPromise>(
      `SELECT r.id, r.case_id, c.title AS case_title, r.outcome,
              r.promised_amount_cents, r.promised_due_at
       FROM provider_responses r
       JOIN cases c ON c.id = r.case_id
       WHERE c.user_id = $1
         AND r.promised_due_at IS NOT NULL
         AND c.status NOT IN ('resolved', 'closed')
       ORDER BY r.promised_due_at ASC
       LIMIT 10`,
      [user.id]
    )
  ]);

  const allCases = caseResult.rows;
  const assistantById = new Map(allCases.map((item) => [item.id, getCaseAssistant({
    id: item.id,
    type: item.type,
    status: item.status,
    companyName: item.company_name,
    orderReference: item.order_reference,
    amountCents: item.amount_cents,
    incidentDate: item.incident_date,
    summary: item.summary,
    documentCount: item.document_count,
    eventCount: item.event_count,
    openDeadlineCount: item.open_deadline_count,
    nextDueAt: item.next_due_at,
    letterCount: item.letter_count
  })]));

  const activeCases = allCases.filter((item) => !["resolved", "closed"].includes(item.status));
  const archivedCount = allCases.filter((item) => item.status === "closed").length;
  const openAmount = activeCases.reduce((sum, item) => sum + (item.amount_cents ?? 0), 0);
  const nextDeadline = activeCases
    .map((item) => item.next_due_at)
    .filter((value): value is string | Date => Boolean(value))
    .sort((a, b) => (timestamp(a) ?? Number.MAX_SAFE_INTEGER) - (timestamp(b) ?? Number.MAX_SAFE_INTEGER))[0] ?? null;

  const attentionCases = activeCases
    .map((item) => ({ item, assistant: assistantById.get(item.id)! }))
    .sort((a, b) => {
      const priority = assistantPriorityRank(a.assistant.priority) - assistantPriorityRank(b.assistant.priority);
      if (priority !== 0) return priority;
      return (timestamp(a.item.next_due_at) ?? Number.MAX_SAFE_INTEGER) - (timestamp(b.item.next_due_at) ?? Number.MAX_SAFE_INTEGER);
    });

  const urgentCount = attentionCases.filter(({ assistant }) => assistant.priority === "urgent" || assistant.priority === "soon").length;
  const withoutDeadlineCount = activeCases.filter((item) => item.open_deadline_count === 0).length;
  const incompleteCount = attentionCases.filter(({ assistant }) => assistant.completeness < 70).length;
  const overdueTaskCount = taskResult.rows.filter((task) => task.due_state === "overdue").length;
  const todayTaskCount = taskResult.rows.filter((task) => task.due_state === "today").length;
  const waitingReplyCount = activeCases.filter((item) => item.status === "waiting_for_reply").length;

  const normalizedQuery = q.toLocaleLowerCase("de-DE");
  const visibleCases = allCases
    .filter((item) => {
      if (scope === "active" && item.status === "closed") return false;
      if (scope === "archived" && item.status !== "closed") return false;
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (selectedType && item.type !== selectedType) return false;
      if (normalizedQuery) {
        const haystack = [item.title, item.company_name, item.order_reference].filter(Boolean).join(" ").toLocaleLowerCase("de-DE");
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "updated_asc": return compareNullableNumbers(timestamp(a.updated_at), timestamp(b.updated_at), "asc");
        case "amount_desc": return compareNullableNumbers(a.amount_cents, b.amount_cents, "desc");
        case "amount_asc": return compareNullableNumbers(a.amount_cents, b.amount_cents, "asc");
        case "deadline_asc": return compareNullableNumbers(timestamp(a.next_due_at), timestamp(b.next_due_at), "asc");
        case "deadline_desc": return compareNullableNumbers(timestamp(a.next_due_at), timestamp(b.next_due_at), "desc");
        case "updated_desc":
        default: return compareNullableNumbers(timestamp(a.updated_at), timestamp(b.updated_at), "desc");
      }
    });

  const filterState = { q, status: selectedStatus, type: selectedType, scope, sort };
  const hasFilters = Boolean(q || selectedStatus || selectedType || scope !== "active" || sort !== "updated_desc");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link className="active" href={localizedPath("/dashboard", locale)}>{en ? "My cases" : "Meine Fälle"}</Link>
          <Link href={localizedPath("/neuer-fall", locale)}>{en ? "New case" : "Neuer Fall"}</Link>
          <Link href={localizedPath("/fristen", locale)}>{en ? "Deadlines" : "Fristen"}</Link>
          <Link href={localizedPath("/dokumente", locale)}>{en ? "Documents" : "Dokumente"}</Link>
          <Link href={localizedPath("/einstellungen", locale)}>{en ? "Settings" : "Einstellungen"}</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post"><button type="submit">{en ? "Sign out" : "Abmelden"}</button></form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">{en ? "Workspace" : "Arbeitszentrale"}</span>
            <h1>{en ? "My cases" : "Meine Fälle"}</h1>
            <p className="dashboard-welcome">{en ? "Welcome" : "Willkommen"}, {user.displayName || user.email}.</p>
          </div>
          <Link className="button button-primary" href={localizedPath("/neuer-fall", locale)}>+ {en ? "New case" : "Neuer Fall"}</Link>
        </header>

        {raw.notice ? <div className="notice-card dashboard-notice" role="status"><strong>{raw.notice}</strong></div> : null}
        {raw.error ? <div className="form-error dashboard-notice" role="alert">{raw.error}</div> : null}

        <div className="stats-grid">
          <div className="stat-card"><span>{en ? "Active cases" : "Aktive Fälle"}</span><strong>{activeCases.length}</strong><small>{archivedCount} {en ? "archived" : "archiviert"} · {allCases.length} {en ? "total" : "insgesamt"}</small></div>
          <div className="stat-card"><span>{en ? "Outstanding amount" : "Offener Betrag"}</span><strong>{formatCurrency(openAmount, "EUR", numberLocale)}</strong><small>{en ? "across active cases" : "über aktive Fälle"}</small></div>
          <div className="stat-card"><span>{en ? "Next deadline" : "Nächste Frist"}</span><strong>{nextDeadline ? formatDate(nextDeadline, numberLocale) : (en ? "None" : "Keine")}</strong><small>{nextDeadline ? (en ? "open deadline" : "offene Frist") : (en ? "no deadline recorded yet" : "noch keine Frist erfasst")}</small></div>
        </div>

        <section className="dashboard-task-summary" aria-label={en ? "Task overview" : "Aufgabenübersicht"}>
          <article className={overdueTaskCount ? "danger" : ""}><span>{en ? "Overdue tasks" : "Überfällige Aufgaben"}</span><strong>{overdueTaskCount}</strong><small>{en ? "review now" : "sofort prüfen"}</small></article>
          <article><span>{en ? "Due today" : "Heute fällig"}</span><strong>{todayTaskCount}</strong><small>{en ? "open tasks" : "offene Aufgaben"}</small></article>
          <article><span>{en ? "Reply pending" : "Antwort ausstehend"}</span><strong>{waitingReplyCount}</strong><small>{en ? "cases waiting for the provider" : "Fälle warten auf den Anbieter"}</small></article>
        </section>

        <section className="panel dashboard-task-panel" id="aufgaben">
          <div className="panel-header"><div><span className="eyebrow">{en ? "Tasks" : "Aufgaben"}</span><h2>{en ? "Today and next" : "Heute und als Nächstes"}</h2></div><span>{taskResult.rows.length} {en ? "open" : "offen"}</span></div>
          {taskResult.rows.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✓</div><h3>{en ? "No open tasks" : "Keine offenen Aufgaben"}</h3><p>{en ? "You can add new tasks from a case's management view." : "Neue Aufgaben können in der Steuerung eines Falls angelegt werden."}</p></div>
          ) : (
            <div className="dashboard-task-list">
              {taskResult.rows.slice(0, 8).map((task) => {
                const priority = getTaskPriority(task.priority);
                return (
                  <article className={`dashboard-task-row dashboard-task-${task.due_state}`} key={task.id}>
                    <Link className="dashboard-task-main" href={localizedPath(`/faelle/${task.case_id}/steuerung`, locale)}><strong>{task.title}</strong><span>{task.case_title}</span></Link>
                    <span className="dashboard-task-due">{task.due_at ? formatDateTime(task.due_at, numberLocale) : (en ? "No due date" : "Ohne Fälligkeit")}</span>
                    <span className="dashboard-task-priority">{priority.label}</span>
                    <form action={`/api/tasks/${task.id}/complete`} method="post"><input name="returnTo" type="hidden" value={localizedPath("/dashboard", locale)} /><button className="button button-secondary" type="submit">{en ? "Done" : "Erledigt"}</button></form>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {promiseResult.rows.length ? (
          <section className="panel dashboard-task-panel">
            <div className="panel-header"><div><span className="eyebrow">{en ? "Provider promises" : "Anbieterzusagen"}</span><h2>{en ? "Track payments and dates" : "Zahlungen und Termine beobachten"}</h2></div><span>{promiseResult.rows.length} {en ? "open" : "offen"}</span></div>
            <div className="dashboard-task-list">
              {promiseResult.rows.slice(0, 5).map((promise) => (
                <article className="dashboard-task-row" key={promise.id}>
                  <Link className="dashboard-task-main" href={localizedPath(`/faelle/${promise.case_id}/steuerung`, locale)}><strong>{promise.case_title}</strong><span>{getProviderOutcome(promise.outcome).label}</span></Link>
                  <span className="dashboard-task-due">{formatDate(promise.promised_due_at, numberLocale)}</span>
                  <span className="dashboard-task-priority">{promise.promised_amount_cents !== null ? formatCurrency(promise.promised_amount_cents, "EUR", numberLocale) : (en ? "Date" : "Termin")}</span>
                  <Link className="button button-secondary" href={localizedPath(`/faelle/${promise.case_id}/steuerung`, locale)}>{en ? "Open" : "Öffnen"}</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="assistant-summary-grid">
          <Link className="assistant-summary-card assistant-summary-urgent" href={localizedPath("/fristen", locale)}><span>{en ? "Urgent or due soon" : "Dringend oder bald fällig"}</span><strong>{urgentCount}</strong><small>{en ? "deadlines requiring action" : "Fristen mit direktem Handlungsbedarf"}</small></Link>
          <Link className="assistant-summary-card" href={`${localizedPath("/dashboard", locale)}?scope=active&sort=deadline_asc`}><span>{en ? "No open deadline" : "Ohne offene Frist"}</span><strong>{withoutDeadlineCount}</strong><small>{en ? "the assistant can create a 7-day deadline" : "Assistent kann eine 7-Tage-Frist anlegen"}</small></Link>
          <Link className="assistant-summary-card" href="#aufmerksamkeit"><span>{en ? "Incomplete case files" : "Unvollständige Fallakten"}</span><strong>{incompleteCount}</strong><small>{en ? "less than 70% complete" : "weniger als 70 % vollständig"}</small></Link>
        </div>

        <section className="panel dashboard-assistant-panel" id="aufmerksamkeit">
          <div className="panel-header"><div><span className="eyebrow">{en ? "Case assistant" : "Fallassistent"}</span><h2>{en ? "What matters now" : "Was jetzt wichtig ist"}</h2></div><span>{attentionCases.length} {en ? "active cases reviewed" : "aktive Fälle bewertet"}</span></div>
          {attentionCases.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✓</div><h3>{en ? "No open recommendations" : "Keine offenen Empfehlungen"}</h3><p>{en ? "No active case currently needs your attention." : "Aktuell gibt es keinen aktiven Fall, der deine Aufmerksamkeit benötigt."}</p></div>
          ) : (
            <div className="dashboard-assistant-list">
              {attentionCases.slice(0, 5).map(({ item, assistant }) => (
                <Link className={`dashboard-assistant-row assistant-row-${assistant.priority}`} href={localizedPath(`/faelle/${item.id}/assistent`, locale)} key={item.id}>
                  <span className="dashboard-assistant-icon"><CaseTypeIcon type={item.type} /></span>
                  <span className="dashboard-assistant-copy"><strong>{item.title}</strong><span>{assistant.headline}</span></span>
                  <span className="dashboard-assistant-progress"><strong>{assistant.completeness}%</strong><small>{en ? "complete" : "vollständig"}</small></span>
                  <span className={`assistant-priority assistant-priority-${assistant.priority}`}>{assistant.priorityLabel}</span>
                  <span className="case-row-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-tools panel">
          <div className="dashboard-scope-tabs" aria-label={en ? "Case view" : "Fallansicht"}>{localizedScopes.map((item) => <Link className={scope === item.value ? "active" : ""} href={dashboardHref(filterState, { scope: item.value }, locale)} key={item.value}>{item.label}</Link>)}</div>
          <form className="dashboard-filter-form" action={localizedPath("/dashboard", locale)} method="get">
            <input name="scope" type="hidden" value={scope} />
            <label className="dashboard-search-field"><span>{en ? "Search" : "Suche"}</span><input name="q" type="search" defaultValue={q} placeholder={en ? "Title, provider or reference" : "Titel, Anbieter oder Referenz"} maxLength={100} /></label>
            <label><span>Status</span><select name="status" defaultValue={selectedStatus}><option value="">{en ? "All statuses" : "Alle Status"}</option>{caseStatuses.map((item) => <option value={item.value} key={item.value}>{getLocalizedCaseStatus(item.value, locale).label}</option>)}</select></label>
            <label><span>{en ? "Case type" : "Fallart"}</span><select name="type" defaultValue={selectedType}><option value="">{en ? "All case types" : "Alle Fallarten"}</option>{localizedTypes.map((item) => <option value={item.dbValue} key={item.dbValue}>{item.title}</option>)}</select></label>
            <label><span>{en ? "Sort" : "Sortierung"}</span><select name="sort" defaultValue={sort}>{localizedSortModes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <div className="dashboard-filter-actions"><button className="button button-primary" type="submit">{en ? "Apply" : "Anwenden"}</button>{hasFilters ? <Link className="button button-secondary" href={localizedPath("/dashboard", locale)}>{en ? "Reset" : "Zurücksetzen"}</Link> : null}</div>
          </form>
        </section>

        <div className="panel dashboard-case-panel">
          <div className="panel-header"><h2>{scope === "archived" ? (en ? "Archived cases" : "Archivierte Fälle") : scope === "all" ? (en ? "All cases" : "Alle Fälle") : (en ? "Active cases" : "Aktive Fälle")}</h2><span>{visibleCases.length} {en ? "of" : "von"} {allCases.length}</span></div>
          {allCases.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">+</div><h3>{en ? "No case yet" : "Noch kein Fall angelegt"}</h3><p>{en ? "Create your first case and keep the provider, amount, timeline and deadlines together." : "Lege deinen ersten Fall an und sammle Anbieter, Betrag, Chronik und Fristen an einem Ort."}</p><Link className="button button-primary" href={localizedPath("/neuer-fall", locale)}>{en ? "Create first case" : "Ersten Fall anlegen"}</Link></div>
          ) : visibleCases.length === 0 ? (
            <div className="empty-state dashboard-no-results"><div className="empty-state-icon">⌕</div><h3>{en ? "No matching cases" : "Keine passenden Fälle"}</h3><p>{en ? "No case matches your search and selected filters." : "Zu deiner Suche und den gewählten Filtern wurde kein Fall gefunden."}</p><Link className="button button-secondary" href={localizedPath("/dashboard", locale)}>{en ? "Clear search and filters" : "Suche und Filter löschen"}</Link></div>
          ) : (
            <div className="case-list">
              {visibleCases.map((item) => {
                const status = getLocalizedCaseStatus(item.status, locale);
                const type = getLocalizedCaseTypeByValue(item.type, locale);
                return (
                  <Link className="case-row dashboard-case-row" href={localizedPath(`/faelle/${item.id}`, locale)} key={item.id}>
                    <div className="case-row-main"><div className="case-avatar"><CaseTypeIcon type={item.type} /></div><div><h3>{item.title}</h3><p>{item.company_name || type?.title || (en ? "No provider" : "Ohne Anbieter")}{item.order_reference ? ` · ${item.order_reference}` : ""}</p></div></div>
                    <div className="dashboard-case-meta"><strong>{formatCurrency(item.amount_cents, item.currency, numberLocale)}</strong><small>{item.next_due_at ? `${en ? "Deadline" : "Frist"}: ${formatDate(item.next_due_at, numberLocale)}` : (en ? "No open deadline" : "Keine offene Frist")}</small></div>
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
