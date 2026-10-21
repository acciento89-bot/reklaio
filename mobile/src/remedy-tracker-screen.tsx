import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, caseRequest, type MobileCaseDetail } from "./api";
import { createLocalRemedyRepository } from "./remedy-local-storage";
import { addAction, addRemedy, addResponse, closeTracker, createTracker, formatFactualReport, parseAmountCents, recordProgress, remedyProgress, reopenTracker, setActionDone, type RemedyTracker } from "./remedy-tracker";
import { colors, radius, spacing } from "./theme";

type Mode = { kind: "remedy" | "response" | "progress" | "action" | "close" | "reopen"; remedyID?: string };
const localID = () => "record-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; };
const inputCents = (value: number) => `${Math.floor(value/100)}.${String(value%100).padStart(2,"0")}`;
export function RemedyTrackerScreen({ ownerID,token,caseID,onUnauthorized }: { ownerID: string; token: string; caseID: string; onUnauthorized: () => Promise<void> }) {
  const router = useRouter(), insets = useSafeAreaInsets(), window = useWindowDimensions();
  const [language,setLanguage] = useState<"de" | "en">(() => Intl.DateTimeFormat().resolvedOptions().locale.startsWith("de") ? "de" : "en");
  const l = (de: string,en: string) => language === "de" ? de : en;
  const repository = useMemo(() => createLocalRemedyRepository(ownerID),[ownerID]);
  const mounted = useRef(true), tokenRef = useRef(token), loadID = useRef(0), busy = useRef(false);
  tokenRef.current = token;
  const [book,setBook] = useState<RemedyTracker | null>(null), currentBook = useRef<RemedyTracker | null>(null);
  const [original,setOriginal] = useState<MobileCaseDetail | null>(null);
  const [loading,setLoading] = useState(true), [blocked,setBlocked] = useState(false), [saving,setSaving] = useState(false), [error,setError] = useState<string | null>(null);
  const [mode,setMode] = useState<Mode | null>(null), [title,setTitle] = useState(""), [amount,setAmount] = useState(""), [note,setNote] = useState(""), [observedOn,setObservedOn] = useState(today), [responseKind,setResponseKind] = useState<"response" | "offer">("response"), [complete,setComplete] = useState(false), [documents,setDocuments] = useState<string[]>([]), [recordID,setRecordID] = useState(localID), [preview,setPreview] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const publish = useCallback((value: RemedyTracker) => { currentBook.current = value; setBook(value); },[]);
  const explain = (cause: unknown) => {
    const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
    if (code === "conflict") return l("Der Stand wurde inzwischen geändert. Lade neu; deine Eingaben bleiben erhalten.","The record changed. Reload it; your entered fields are retained.");
    if (code === "incomplete") return l("Für den lokalen Abschluss müssen alle Lösungen und lokalen Aufgaben erledigt sein.","All remedies and local actions must be complete before local closure.");
    if (code === "closed") return l("Öffne den lokalen Stand vor Änderungen wieder.","Reopen the local tracker before editing.");
    if (code === "invalid") return l("Prüfe Titel, Notiz, Datum (JJJJ-MM-TT) und Betrag. Erhaltene Beträge müssen zwischen 0 und dem gewünschten Betrag liegen; der Stand darf nicht zurückdatiert werden.","Check title, note, date (YYYY-MM-DD) and amount. Received totals must be between zero and the requested amount; progress cannot be backdated.");
    return l("Die lokalen Daten konnten nicht geladen oder gespeichert werden. Vorhandene Dateien und deine Eingaben bleiben erhalten. Bitte erneut laden oder speichern.","Local data could not be loaded or saved. Existing files and your entered fields are preserved. Retry loading or saving.");
  };
  const load = useCallback(async () => {
    const request = ++loadID.current, requestToken = token;
    setLoading(true); setError(null);
    try {
      const [response,archive] = await Promise.all([caseRequest(requestToken,caseID),repository.load()]);
      if (!mounted.current || request !== loadID.current || tokenRef.current !== requestToken) return;
      setOriginal(response.case); publish(archive.trackers.find(b => b.caseID === caseID) ?? createTracker(ownerID,caseID,response.case.title,new Date().toISOString()));
      setBlocked(false);
    } catch (cause) {
      if (!mounted.current || request !== loadID.current || tokenRef.current !== requestToken) return;
      if (cause instanceof ApiError && cause.status === 401) { await onUnauthorized(); return; }
      setBlocked(true); setError(cause instanceof ApiError ? cause.message : "local-load");
    } finally { if (mounted.current && request === loadID.current) setLoading(false); }
  },[token,caseID,ownerID,repository,publish,onUnauthorized]);
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; loadID.current++; }; },[load]);
  const mutate = async (change: (value: RemedyTracker,at: string) => RemedyTracker, closeForm = false) => {
    if (busy.current || blocked || !currentBook.current) return;
    busy.current = true; setSaving(true); setError(null);
    try {
      const changed = change(currentBook.current,new Date().toISOString());
      const archive = await repository.saveTracker(changed);
      if (!mounted.current) return;
      const saved = archive.trackers.find(b => b.caseID === caseID); if (saved) publish(saved);
      if (closeForm) setMode(null);
    } catch (cause) { if (mounted.current) setError(explain(cause)); }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  const open = (value: Mode) => {
    setMode(value); setTitle(""); setNote(""); setObservedOn(today()); setResponseKind("response"); setDocuments([]); setRecordID(localID());
    const progress = value.remedyID && book ? remedyProgress(book,value.remedyID) : null;
    setAmount(progress?.receivedCents !== null && progress?.receivedCents !== undefined ? inputCents(progress.receivedCents) : "");
    setComplete(progress?.state === "complete"); setPreview(false);
    scroll.current?.scrollTo({ y: 0,animated: true });
  };
  const submit = () => {
    if (!mode) return;
    void mutate((value,at) => {
      if (mode.kind === "remedy") return addRemedy(value,{ id: recordID,title,requestedCents: amount.trim() ? parseAmountCents(amount) : null,currency: original?.currency || "EUR" },at);
      if (mode.kind === "action") return addAction(value,{ id: recordID,title },at);
      if (mode.kind === "close") return closeTracker(value,{ id: recordID,note },at);
      if (mode.kind === "reopen") return reopenTracker(value,note,at);
      if (!mode.remedyID) throw Error("missing remedy");
      if (mode.kind === "response") return addResponse(value,mode.remedyID,{ id: recordID,kind: responseKind,note,observedOn,documentIDs: documents },at);
      const remedy = value.remedies.find(r => r.id === mode.remedyID); if (!remedy) throw Error("missing remedy");
      return recordProgress(value,mode.remedyID,{ id: recordID,note,observedOn,documentIDs: documents,receivedCents: remedy.requestedCents === null ? null : parseAmountCents(amount),complete: remedy.requestedCents === null ? complete : null },at);
    },true);
  };
  const money = (value: number,currency: string) => new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB",{ style: "currency",currency }).format(value/100);
  const report = book && original ? formatFactualReport(book,language,{ title: original.title,status: original.status,documents: original.documents.map(d => ({ id: d.id,name: d.originalName })),openDeadlines: original.deadlines.filter(d => !d.completedAt).map(d => ({ id: d.id,title: d.title,dueAt: d.dueAt })) }) : "";
  const chosen = mode?.remedyID && book ? book.remedies.find(r => r.id === mode.remedyID) : null;
  const action = (label: string,handler: () => void,disabled = false) => <Pressable accessibilityRole="button" disabled={disabled || saving} onPress={handler} style={({ pressed }) => [styles.button,(disabled || saving) && styles.disabled,pressed && styles.pressed]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  return <SafeAreaView style={styles.flex} edges={["top","left","right","bottom"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content,{ maxWidth: Math.min(window.width-insets.left-insets.right,800),alignSelf: "center",width: "100%" }]}>
        {action(l("← Zur Fallakte","← Back to case"),() => router.back())}
        <View style={styles.row}>{action("Deutsch",() => setLanguage("de"))}{action("English",() => setLanguage("en"))}</View>
        <Text style={styles.heading}>{l("Gewünschte Lösungen","Requested remedies")}</Text>
        <Text style={styles.copy}>{l("Nur auf diesem Gerät und für dieses Konto. Erhaltene Leistungen werden getrennt von Angeboten erfasst. Fallstatus, Fristen, Erinnerungen, Belege und die Web-App bleiben unverändert.","For this account on this device only. Actual fulfillment is separate from offers. Case status, deadlines, reminders, attachments and the web app remain unchanged.")}</Text>
        {loading ? <ActivityIndicator color={colors.accentSoft} /> : null}
        {error ? <View style={styles.error}><Text style={styles.errorText}>{error === "local-load" ? explain(null) : error}</Text>{action(l("Neu laden — Eingaben behalten","Reload — retain entered fields"),() => void load())}</View> : null}
        {book && original ? <>
          <Text style={styles.title}>{original.title}</Text>
          <Text style={styles.copy}>{l("Ursprünglicher Fallstatus: ","Original case status: ")}{original.status}</Text>
          <Text style={styles.copy}>{book.closedAt ? l("Lokal abgeschlossen: ","Closed locally: ")+book.closedAt : l("Lokaler Stand offen","Local tracker open")}</Text>
          {mode ? <View style={styles.card}>
            <Text style={styles.title}>{mode.kind === "remedy" ? l("Lösung erfassen","Add requested remedy") : mode.kind === "action" ? l("Lokale Aufgabe","Local action") : mode.kind === "response" ? l("Antwort oder Angebot","Response or offer") : mode.kind === "progress" ? l("Tatsächlichen Stand erfassen","Record actual progress") : mode.kind === "close" ? l("Lokalen Stand abschließen","Close local tracker") : l("Lokalen Stand wieder öffnen","Reopen local tracker")}</Text>
            {mode.kind === "remedy" || mode.kind === "action" ? <><Text style={styles.label}>{l("Bezeichnung","Title")}</Text><TextInput accessibilityLabel={l("Bezeichnung","Title")} value={title} onChangeText={setTitle} maxLength={180} editable={!saving} style={styles.input} placeholderTextColor={colors.muted} /></> : null}
            {mode.kind === "remedy" || (mode.kind === "progress" && chosen?.requestedCents !== null) ? <><Text style={styles.label}>{mode.kind === "remedy" ? l("Gewünschter Betrag, optional","Requested amount, optional") : l("Bisher insgesamt tatsächlich erhalten","Total actually received so far")} ({chosen?.currency || original.currency})</Text><TextInput accessibilityLabel={l("Betrag","Amount")} value={amount} onChangeText={setAmount} maxLength={20} keyboardType="decimal-pad" editable={!saving} style={styles.input} placeholder="0,00" placeholderTextColor={colors.muted} /><Text style={styles.copy}>{l("Ohne Tausendertrennzeichen. Ein leerer gewünschter Betrag bedeutet eine nicht finanzielle Lösung.","No thousands separators. An empty requested amount means a nonfinancial remedy.")}</Text></> : null}
            {mode.kind === "response" ? <View style={styles.row}>{action((responseKind === "response" ? "✓ " : "")+l("Antwort","Response"),() => setResponseKind("response"))}{action((responseKind === "offer" ? "✓ " : "")+l("Angebot — noch nicht erhalten","Offer — not yet received"),() => setResponseKind("offer"))}</View> : null}
            {mode.kind === "progress" && chosen?.requestedCents === null ? action((complete ? "✓ " : "○ ")+l("Tatsächlich erledigt","Actually complete"),() => setComplete(!complete)) : null}
            {mode.kind !== "remedy" && mode.kind !== "action" ? <><Text style={styles.label}>{l("Sachliche Notiz / Grund","Factual note / reason")}</Text><TextInput accessibilityLabel={l("Sachliche Notiz","Factual note")} value={note} onChangeText={setNote} multiline maxLength={2000} editable={!saving} style={[styles.input,styles.multiline]} placeholderTextColor={colors.muted} /></> : null}
            {mode.kind === "response" || mode.kind === "progress" ? <><Text style={styles.label}>{l("Beobachtet am (JJJJ-MM-TT)","Observed on (YYYY-MM-DD)")}</Text><TextInput accessibilityLabel={l("Beobachtet am","Observed on")} value={observedOn} onChangeText={setObservedOn} autoCapitalize="none" maxLength={10} editable={!saving} style={styles.input} placeholder="2026-10-21" placeholderTextColor={colors.muted} /><Text style={styles.label}>{l("Vorhandene Belege verknüpfen (optional)","Link existing documents (optional)")}</Text>{original.documents.map(d => <View key={d.id}>{action((documents.includes(d.id) ? "✓ " : "○ ")+d.originalName,() => setDocuments(documents.includes(d.id) ? documents.filter(id => id !== d.id) : [...documents,d.id]))}</View>)}</> : null}
            <View style={styles.row}>{action(l("Lokal speichern","Save locally"),submit,blocked)}{action(l("Abbrechen","Cancel"),() => setMode(null))}</View>
          </View> : null}
          <View style={styles.row}>{action(l("+ Gewünschte Lösung","+ Requested remedy"),() => open({ kind: "remedy" }),blocked || !!book.closedAt)}{action(l("+ Lokale Aufgabe","+ Local action"),() => open({ kind: "action" }),blocked || !!book.closedAt)}{action(l("Bericht ansehen","Preview report"),() => { setPreview(!preview); setMode(null); })}</View>
          {preview ? <View style={styles.card}><Text selectable style={styles.report}>{report}</Text>{action(l("Teilen-Menü öffnen","Open share sheet"),() => { void Share.share({ message: report }).catch(() => { if (mounted.current) setError(l("Das Teilen-Menü konnte nicht geöffnet werden.","The share sheet could not be opened.")); }); })}<Text style={styles.copy}>{l("Wähle selbst, ob und mit wem du teilst. Keine Originalbelege werden angehängt.","Choose whether and with whom to share. No original attachments are included.")}</Text></View> : null}
          <View style={[styles.grid,window.width-insets.left-insets.right >= 680 && styles.wideGrid]}>{book.remedies.map(remedy => {
            const progress = remedyProgress(book,remedy.id);
            return <View key={remedy.id} style={[styles.card,styles.remedyCard,window.width-insets.left-insets.right >= 680 && styles.wideCard]}>
              <Text style={styles.title}>{remedy.title}</Text><Text style={styles.status}>{progress.state === "complete" ? l("Erledigt","Complete") : progress.state === "partial" ? l("Teilweise erhalten","Partly received") : l("Offen","Open")}</Text>
              {remedy.requestedCents !== null ? <><Text style={styles.copy}>{l("Gewünscht: ","Requested: ")}{money(remedy.requestedCents,remedy.currency)}</Text><Text style={styles.copy}>{l("Erhalten: ","Received: ")}{money(progress.receivedCents ?? 0,remedy.currency)}</Text><Text style={styles.label}>{l("Verbleibend: ","Remaining: ")}{money(progress.remainingCents ?? 0,remedy.currency)}</Text></> : null}
              <View style={styles.row}>{action(l("Antwort / Angebot","Response / offer"),() => open({ kind: "response",remedyID: remedy.id }),blocked || !!book.closedAt)}{action(l("Stand erfassen","Record progress"),() => open({ kind: "progress",remedyID: remedy.id }),blocked || !!book.closedAt)}</View>
              {remedy.records.map(record => <View key={record.id} style={styles.record}><Text style={styles.label}>{record.kind === "offer" ? l("Angebot (nicht erhalten)","Offer (not received)") : record.kind === "response" ? l("Antwort","Response") : l("Erfasster Stand","Recorded progress")}</Text><Text style={styles.copy}>{record.observedOn}</Text><Text style={styles.copy}>{record.note}</Text>{record.kind === "progress" ? <Text style={styles.copy}>{remedy.requestedCents === null ? (record.complete ? l("Erledigt","Complete") : l("Wieder offen","Pending again")) : money(record.receivedCents ?? 0,remedy.currency)}</Text> : null}{record.documentIDs.map(id => <Text key={id} style={styles.copy}>{l("Beleg: ","Document: ")}{original.documents.find(d => d.id === id)?.originalName || l("Verweis nicht mehr vorhanden: ","Reference no longer present: ")+id}</Text>)}</View>)}
            </View>;
          })}</View>
          <View style={styles.card}><Text style={styles.title}>{l("Lokale verbleibende Aufgaben","Local remaining actions")}</Text>{book.actions.map(item => <View key={item.id}>{action((item.done ? "✓ " : "○ ")+item.title,() => { void mutate((value,at) => setActionDone(value,item.id,!item.done,at)); },blocked || !!book.closedAt)}</View>)}<Text style={styles.copy}>{l("Diese Aufgaben sind keine neuen Fristen oder Erinnerungen.","These actions create no deadlines or reminders.")}</Text></View>
          <View style={styles.row}>{book.closedAt ? action(l("Lokal wieder öffnen","Reopen locally"),() => open({ kind: "reopen" }),blocked) : action(l("Lokalen Stand abschließen","Close local tracker"),() => open({ kind: "close" }),blocked)}</View>
          {book.closures.map(closure => <View key={closure.id} style={styles.card}><Text style={styles.title}>{l("Gespeicherter lokaler Abschluss","Recorded local closure")}</Text><Text style={styles.copy}>{closure.closedAt}</Text><Text style={styles.copy}>{closure.note}</Text>{closure.reopenedAt ? <Text style={styles.copy}>{l("Wieder geöffnet: ","Reopened: ")}{closure.reopenedAt}{"\n"}{closure.reopenNote}</Text> : null}</View>)}
        </> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  flex: { flex: 1,backgroundColor: colors.background },content: { flexGrow: 1,padding: spacing.md,gap: spacing.md },heading: { color: colors.text,fontSize: 28,fontWeight: "900" },title: { color: colors.text,fontSize: 20,fontWeight: "800" },label: { color: colors.text,fontWeight: "800",lineHeight: 22 },copy: { color: colors.muted,lineHeight: 22 },row: { flexDirection: "row",flexWrap: "wrap",gap: spacing.sm },button: { minHeight: 48,justifyContent: "center",padding: spacing.sm,borderRadius: radius.sm,borderWidth: 1,borderColor: colors.line,maxWidth: "100%" },buttonText: { color: colors.accentSoft,fontWeight: "800",flexShrink: 1 },disabled: { opacity: 0.45 },pressed: { opacity: 0.75 },card: { padding: spacing.md,gap: spacing.sm,borderRadius: radius.md,borderWidth: 1,borderColor: colors.line,backgroundColor: colors.panel },input: { minHeight: 48,padding: spacing.sm,color: colors.text,borderColor: colors.line,borderWidth: 1,borderRadius: radius.sm,backgroundColor: colors.panelSoft },multiline: { minHeight: 110,textAlignVertical: "top" },error: { padding: spacing.md,gap: spacing.sm,backgroundColor: colors.panel,borderWidth: 1,borderColor: colors.danger,borderRadius: radius.md },errorText: { color: colors.danger,lineHeight: 22 },status: { color: colors.accentSoft,fontWeight: "800" },record: { borderTopWidth: 1,borderColor: colors.line,paddingTop: spacing.sm,gap: 4 },grid: { gap: spacing.md },wideGrid: { flexDirection: "row",flexWrap: "wrap",alignItems: "flex-start" },remedyCard: { width: "100%" },wideCard: { width: "48%" },report: { color: colors.text,lineHeight: 22,fontSize: 14 }
});
