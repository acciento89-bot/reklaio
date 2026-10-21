export type RemedyRecord = { id: string; kind: "response" | "offer" | "progress"; note: string; observedOn: string; recordedAt: string; documentIDs: string[]; receivedCents: number | null; complete: boolean | null };
export type RequestedRemedy = { id: string; title: string; requestedCents: number | null; currency: string; records: RemedyRecord[] };
export type RemainingAction = { id: string; title: string; done: boolean; createdAt: string; completedAt: string | null };
export type RemedyState = { state: "open" | "partial" | "complete"; receivedCents: number | null; remainingCents: number | null };
export type RemedyClosure = { id: string; note: string; closedAt: string; reopenedAt: string | null; reopenNote: string | null; remedies: Array<{ id: string; title: string; requestedCents: number | null; currency: string } & RemedyState>; actions: RemainingAction[] };
export type RemedyTracker = { ownerID: string; caseID: string; caseTitle: string; revision: number; createdAt: string; updatedAt: string; remedies: RequestedRemedy[]; actions: RemainingAction[]; closedAt: string | null; closures: RemedyClosure[] };
export type RemedyArchive = { schemaVersion: 1; ownerID: string; revision: number; trackers: RemedyTracker[] };
export type CaseFacts = { title: string; status: string; documents: Array<{ id: string; name: string }>; openDeadlines: Array<{ id: string; title: string; dueAt: string }> };
export const MAX_REMEDY_ARCHIVE_BYTES = 4_000_000;
export class RemedyError extends Error {
  readonly code: "invalid" | "closed" | "incomplete" | "conflict" | "owner" | "future" | "corrupt" | "deleted";
  constructor(code: RemedyError["code"]) { super(code); this.code = code; this.name = "RemedyError"; }
}
function ensure(value: unknown, code: RemedyError["code"] = "invalid"): asserts value { if (!value) throw new RemedyError(code); }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function text(value: unknown, max = 2000): value is string { return typeof value === "string" && value.trim().length > 0 && value.length <= max; }
function id(value: unknown): value is string { return typeof value === "string" && /^[a-zA-Z0-9_-]{4,100}$/.test(value); }
export function normalizeOwnerID(value: string): string { ensure(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value), "owner"); return value.toLowerCase(); }
function timestamp(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function day(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value) && Number.isFinite(Date.parse(value + "T00:00:00.000Z")) && new Date(value + "T00:00:00.000Z").toISOString().slice(0,10) === value; }
function cents(value: unknown, positive = false): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= (positive ? 1 : 0); }
function currency(value: unknown): value is string { return typeof value === "string" && /^[A-Z]{3}$/.test(value); }
function unique(values: string[]) { return new Set(values).size === values.length; }
export function utf8Bytes(value: string): number {
  let result = 0;
  for (const char of value) { const n = char.codePointAt(0)!; result += n <= 0x7f ? 1 : n <= 0x7ff ? 2 : n <= 0xffff ? 3 : 4; }
  return result;
}
export function parseAmountCents(input: string): number {
  const clean = input.trim(); ensure(/^\d+(?:[.,]\d{1,2})?$/.test(clean));
  const [whole, fraction = ""] = clean.replace(",", ".").split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2,"0")); ensure(cents(result)); return result;
}
export function createTracker(ownerID: string, caseID: string, caseTitle: string, at: string): RemedyTracker {
  ensure(timestamp(at) && text(caseTitle,240));
  return { ownerID: normalizeOwnerID(ownerID),caseID: normalizeOwnerID(caseID),caseTitle: caseTitle.trim(),revision: 0,createdAt: at,updatedAt: at,remedies: [],actions: [],closedAt: null,closures: [] };
}
function editable(book: RemedyTracker, at: string) { validateTracker(book); ensure(!book.closedAt,"closed"); ensure(timestamp(at) && at >= book.updatedAt); }
function update(book: RemedyTracker, value: Partial<RemedyTracker>, at: string): RemedyTracker {
  const next = { ...book,...value,revision: book.revision + 1,updatedAt: at }; validateTracker(next); return next;
}
function findRemedy(book: RemedyTracker, remedyID: string) { const item = book.remedies.find(r => r.id === remedyID); ensure(item); return item; }
function allIDs(book: RemedyTracker) { return [...book.remedies.map(r => r.id),...book.remedies.flatMap(r => r.records.map(e => e.id)),...book.actions.map(a => a.id),...book.closures.map(c => c.id)]; }
export function addRemedy(book: RemedyTracker, input: Omit<RequestedRemedy,"records">, at: string): RemedyTracker {
  editable(book,at); ensure(id(input.id) && !allIDs(book).includes(input.id) && text(input.title,180));
  ensure(input.requestedCents === null || cents(input.requestedCents,true)); ensure(currency(input.currency));
  return update(book,{ remedies: [...book.remedies,{ ...input,title: input.title.trim(),records: [] }] },at);
}
function appendRecord(book: RemedyTracker, remedyID: string, record: RemedyRecord, at: string): RemedyTracker {
  const remedy = findRemedy(book,remedyID);
  const existing = remedy.records.find(r => r.id === record.id);
  if (existing) { ensure(JSON.stringify(existing) === JSON.stringify({ ...record,recordedAt: existing.recordedAt })); return book; }
  editable(book,at); ensure(!allIDs(book).includes(record.id));
  return update(book,{ remedies: book.remedies.map(r => r.id === remedyID ? { ...r,records: [...r.records,record] } : r) },at);
}
export function addResponse(book: RemedyTracker, remedyID: string, input: Omit<RemedyRecord,"recordedAt" | "receivedCents" | "complete"> & { kind: "response" | "offer" }, at: string): RemedyTracker {
  return appendRecord(book,remedyID,{ ...input,note: input.note.trim(),recordedAt: at,receivedCents: null,complete: null },at);
}
export function recordProgress(book: RemedyTracker, remedyID: string, input: Omit<RemedyRecord,"recordedAt" | "kind">, at: string): RemedyTracker {
  const remedy = findRemedy(book,remedyID), previous = [...remedy.records].reverse().find(r => r.kind === "progress");
  ensure(!previous || input.observedOn >= previous.observedOn);
  return appendRecord(book,remedyID,{ ...input,note: input.note.trim(),recordedAt: at,kind: "progress" },at);
}
export function remedyProgress(book: RemedyTracker, remedyID: string): RemedyState {
  const remedy = findRemedy(book,remedyID), latest = [...remedy.records].reverse().find(r => r.kind === "progress");
  if (remedy.requestedCents !== null) {
    const received = latest?.receivedCents ?? 0, remaining = remedy.requestedCents - received;
    return { state: remaining === 0 ? "complete" : received > 0 ? "partial" : "open",receivedCents: received,remainingCents: remaining };
  }
  return { state: latest?.complete === true ? "complete" : "open",receivedCents: null,remainingCents: null };
}
export function addAction(book: RemedyTracker, input: { id: string; title: string }, at: string): RemedyTracker {
  editable(book,at); ensure(id(input.id) && !allIDs(book).includes(input.id) && text(input.title,180));
  return update(book,{ actions: [...book.actions,{ id: input.id,title: input.title.trim(),done: false,createdAt: at,completedAt: null }] },at);
}
export function setActionDone(book: RemedyTracker, actionID: string, done: boolean, at: string): RemedyTracker {
  editable(book,at); const action = book.actions.find(a => a.id === actionID); ensure(action && typeof done === "boolean");
  if (action.done === done) return book;
  return update(book,{ actions: book.actions.map(a => a.id === actionID ? { ...a,done,completedAt: done ? at : null } : a) },at);
}
export function closeTracker(book: RemedyTracker, input: { id: string; note: string }, at: string): RemedyTracker {
  editable(book,at); ensure(id(input.id) && !allIDs(book).includes(input.id) && text(input.note));
  ensure(book.remedies.length > 0 && book.remedies.every(r => remedyProgress(book,r.id).state === "complete") && book.actions.every(a => a.done),"incomplete");
  const closure: RemedyClosure = { id: input.id,note: input.note.trim(),closedAt: at,reopenedAt: null,reopenNote: null,
    remedies: book.remedies.map(r => ({ id: r.id,title: r.title,requestedCents: r.requestedCents,currency: r.currency,...remedyProgress(book,r.id) })),actions: book.actions.map(a => ({ ...a })) };
  return update(book,{ closedAt: at,closures: [...book.closures,closure] },at);
}
export function reopenTracker(book: RemedyTracker, note: string, at: string): RemedyTracker {
  validateTracker(book); ensure(book.closedAt && text(note) && timestamp(at) && at >= book.updatedAt);
  return update(book,{ closedAt: null,closures: book.closures.map((c,index) => index === book.closures.length - 1 ? { ...c,reopenedAt: at,reopenNote: note.trim() } : c) },at);
}
function validateAction(value: unknown, start: string, end: string): asserts value is RemainingAction {
  ensure(object(value) && id(value.id) && text(value.title,180) && typeof value.done === "boolean" && timestamp(value.createdAt) && value.createdAt >= start && value.createdAt <= end);
  ensure(value.done ? timestamp(value.completedAt) && value.completedAt >= value.createdAt && value.completedAt <= end : value.completedAt === null);
}
export function validateTracker(value: unknown): asserts value is RemedyTracker {
  ensure(object(value),"corrupt"); const book = value;
  ensure(typeof book.ownerID === "string" && normalizeOwnerID(book.ownerID) === book.ownerID && typeof book.caseID === "string" && normalizeOwnerID(book.caseID) === book.caseID);
  ensure(text(book.caseTitle,240) && cents(book.revision) && timestamp(book.createdAt) && timestamp(book.updatedAt) && book.updatedAt >= book.createdAt);
  ensure(Array.isArray(book.remedies) && book.remedies.length <= 50 && Array.isArray(book.actions) && book.actions.length <= 200 && Array.isArray(book.closures) && book.closures.length <= 200);
  for (const raw of book.remedies) {
    ensure(object(raw) && id(raw.id) && text(raw.title,180) && (raw.requestedCents === null || cents(raw.requestedCents,true)) && currency(raw.currency) && Array.isArray(raw.records) && raw.records.length <= 500);
    let previousTime = book.createdAt, previousProgressDay = "";
    for (const event of raw.records) {
      ensure(object(event) && id(event.id) && ["response","offer","progress"].includes(String(event.kind)) && text(event.note) && day(event.observedOn) && timestamp(event.recordedAt) && event.recordedAt >= previousTime && event.recordedAt <= book.updatedAt);
      ensure(Array.isArray(event.documentIDs) && event.documentIDs.length <= 50 && event.documentIDs.every(id) && unique(event.documentIDs));
      if (event.kind === "progress") {
        ensure(event.observedOn >= previousProgressDay); previousProgressDay = event.observedOn;
        if (raw.requestedCents !== null) ensure(cents(event.receivedCents) && event.receivedCents <= raw.requestedCents && event.complete === null);
        else ensure(event.receivedCents === null && typeof event.complete === "boolean");
      } else ensure(event.receivedCents === null && event.complete === null);
      previousTime = event.recordedAt;
    }
  }
  for (const action of book.actions) validateAction(action,book.createdAt,book.updatedAt);
  const typed = book as unknown as RemedyTracker; ensure(unique(allIDs(typed)));
  let lastEnd = book.createdAt;
  for (let index = 0; index < book.closures.length; index++) {
    const closure: unknown = book.closures[index];
    ensure(object(closure) && id(closure.id) && text(closure.note) && timestamp(closure.closedAt) && closure.closedAt >= lastEnd && closure.closedAt <= book.updatedAt);
    ensure(Array.isArray(closure.remedies) && closure.remedies.length > 0 && Array.isArray(closure.actions));
    ensure(unique(closure.remedies.map(r => String(r?.id))) && unique(closure.actions.map(a => String(a?.id))));
    for (const remedy of closure.remedies) {
      ensure(object(remedy) && id(remedy.id) && text(remedy.title,180) && currency(remedy.currency) && remedy.state === "complete");
      ensure(remedy.requestedCents === null ? remedy.receivedCents === null && remedy.remainingCents === null : cents(remedy.requestedCents,true) && remedy.receivedCents === remedy.requestedCents && remedy.remainingCents === 0);
    }
    for (const action of closure.actions) { validateAction(action,book.createdAt,closure.closedAt); ensure(action.done); }
    if (closure.reopenedAt === null) ensure(closure.reopenNote === null && index === book.closures.length - 1);
    else ensure(timestamp(closure.reopenedAt) && closure.reopenedAt >= closure.closedAt && closure.reopenedAt <= book.updatedAt && text(closure.reopenNote));
    lastEnd = (closure.reopenedAt ?? closure.closedAt) as string;
  }
  const last = typed.closures.at(-1), expectedClosed = last && last.reopenedAt === null ? last.closedAt : null;
  ensure(book.closedAt === expectedClosed);
  if (book.closedAt) ensure(typed.remedies.length > 0 && typed.remedies.every(r => remedyProgress(typed,r.id).state === "complete") && typed.actions.every(a => a.done));
}
export function validateRemedyArchive(value: unknown, expectedOwner: string): asserts value is RemedyArchive {
  ensure(object(value),"corrupt"); ensure(value.schemaVersion === 1,"future");
  ensure(value.ownerID === normalizeOwnerID(expectedOwner),"owner"); ensure(cents(value.revision) && Array.isArray(value.trackers) && value.trackers.length <= 200);
  value.trackers.forEach(validateTracker);
  ensure(value.trackers.every(b => b.ownerID === value.ownerID) && unique(value.trackers.map(b => b.caseID)),"owner");
}
export function encodeRemedyArchive(value: RemedyArchive): string {
  validateRemedyArchive(value,value.ownerID); const raw = JSON.stringify(value); ensure(utf8Bytes(raw) <= MAX_REMEDY_ARCHIVE_BYTES); return raw;
}
export function decodeRemedyArchive(raw: string, expectedOwner: string): RemedyArchive {
  ensure(utf8Bytes(raw) <= MAX_REMEDY_ARCHIVE_BYTES,"corrupt"); const value: unknown = JSON.parse(raw); validateRemedyArchive(value,expectedOwner); return value;
}
export function formatFactualReport(book: RemedyTracker, locale: "de" | "en", facts: CaseFacts): string {
  validateTracker(book); const de = locale === "de", l = (en: string,german: string) => de ? german : en, q = (value: unknown) => JSON.stringify(value);
  const lines = ["Reklaio — " + l("Local remedy record","Lokaler Lösungsstand"),l("Case: ","Fall: ") + q(facts.title),"Case ID: " + book.caseID,
    l("Original case status (unchanged): ","Ursprünglicher Fallstatus (unverändert): ") + q(facts.status),
    l("Tracker: ","Lokaler Stand: ") + (book.closedAt ? l("closed locally ","lokal abgeschlossen ") + book.closedAt : l("open","offen")),""];
  for (const remedy of book.remedies) {
    const state = remedyProgress(book,remedy.id);
    lines.push(l("REQUESTED REMEDY ","GEWÜNSCHTE LÖSUNG ") + q(remedy.title),"ID: " + remedy.id);
    if (remedy.requestedCents !== null) lines.push(l("Requested / received / remaining (currency minor units): ","Gewünscht / erhalten / verbleibend (Währungsuntereinheiten): ") + [remedy.requestedCents,state.receivedCents,state.remainingCents].join(" / ") + " " + remedy.currency);
    else lines.push(l("Completed: ","Erledigt: ") + String(state.state === "complete"));
    for (const entry of remedy.records) {
      lines.push(entry.kind + " | " + entry.observedOn + " | " + l("recorded ","erfasst ") + entry.recordedAt + " | " + q(entry.note));
      if (entry.kind === "progress") lines.push(l("Recorded progress: ","Erfasster Stand: ") + q({ receivedCents: entry.receivedCents,complete: entry.complete }));
      for (const documentID of entry.documentIDs) {
        const document = facts.documents.find(d => d.id === documentID);
        lines.push(l("Document reference: ","Belegverweis: ") + documentID + " | " + q(document?.name ?? l("missing from current case","nicht mehr im aktuellen Fall vorhanden")));
      }
    }
    lines.push("");
  }
  lines.push(l("REMAINING ACTIONS","VERBLEIBENDE AUFGABEN"));
  for (const action of book.actions) lines.push((action.done ? "[x] " : "[ ] ") + q(action.title));
  lines.push("",l("LOCAL CLOSURE HISTORY","LOKALE ABSCHLÜSSE"));
  for (const closure of book.closures) {
    lines.push(closure.closedAt + " | " + q(closure.note),l("Snapshot: ","Gespeicherter Stand: ") + q({ remedies: closure.remedies,actions: closure.actions }));
    if (closure.reopenedAt) lines.push(l("Reopened: ","Wieder geöffnet: ") + closure.reopenedAt + " | " + q(closure.reopenNote));
  }
  lines.push("",l("ORIGINAL OPEN DEADLINES (UNCHANGED)","URSPRÜNGLICHE OFFENE FRISTEN (UNVERÄNDERT)"));
  for (const deadline of facts.openDeadlines) lines.push(q(deadline.title) + " | " + q(deadline.dueAt));
  lines.push("",l("User-recorded facts stored on this device, not independently verified. Offers are not treated as received fulfillment. Local closure changes neither the original case status nor its reminders. This record provides no legal advice, statutory deadline or legal conclusion. No original attachments are included; notes are JSON-quoted.","Auf diesem Gerät vom Nutzer erfasste Angaben, nicht unabhängig bestätigt. Angebote zählen nicht als tatsächlich erhaltene Erfüllung. Ein lokaler Abschluss ändert weder den Fallstatus noch dessen Erinnerungen. Dieser Stand enthält keine Rechtsberatung, gesetzliche Frist oder rechtliche Schlussfolgerung. Originalbelege werden nicht beigefügt; Notizen sind als JSON-Zeichenfolgen dargestellt."));
  return lines.join("\n");
}
