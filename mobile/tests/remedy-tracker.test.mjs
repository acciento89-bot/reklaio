import test from "node:test";
import assert from "node:assert/strict";
import {
  createTracker, addRemedy, addResponse, recordProgress, remedyProgress,
  addAction, setActionDone, closeTracker, reopenTracker, parseAmountCents,
  encodeRemedyArchive, decodeRemedyArchive, formatFactualReport
} from "../src/remedy-tracker.ts";
import { RemedyRepository } from "../src/remedy-storage.ts";

const owner = "00000000-0000-4000-8000-000000000001";
const otherOwner = "00000000-0000-4000-8000-000000000002";
const caseID = "00000000-0000-4000-8000-000000000003";
const otherCase = "00000000-0000-4000-8000-000000000004";
const at = (n = 0) => `2026-10-21T10:00:${String(n).padStart(2,"0")}.000Z`;
function initial(id = caseID, user = owner) { return createTracker(user,id,"Damaged delivery",at()); }
function requested() { return addRemedy(initial(),{ id: "refund-request",title: "Refund",requestedCents: 10000,currency: "EUR" },at(1)); }
function progress(book,total,id = "progress-1",date = "2026-10-21",time = 3) {
 return recordProgress(book,"refund-request",{ id,note: "User recorded received total",observedOn: date,receivedCents: total,complete: null,documentIDs: [] },at(time));
}
test("Offers do not count; partial/full/corrected totals preserve history and old input",() => {
 const source = requested(); const bytes = JSON.stringify(source);
 let book = addResponse(source,"refund-request",{ id: "offer-1",kind: "offer",note: "Promised full amount",observedOn: "2026-10-21",documentIDs: ["invoice-1"] },at(2));
 assert.equal(remedyProgress(book,"refund-request").remainingCents,10000);
 book = progress(book,2500); assert.equal(remedyProgress(book,"refund-request").state,"partial");
 assert.equal(remedyProgress(book,"refund-request").remainingCents,7500);
 book = progress(book,10000,"progress-2","2026-10-21",4); assert.equal(remedyProgress(book,"refund-request").state,"complete");
 const corrected = progress(book,5000,"progress-3","2026-10-21",5);
 assert.equal(remedyProgress(corrected,"refund-request").state,"partial");
 assert.equal(corrected.remedies[0].records.length,4); assert.equal(JSON.stringify(source),bytes);
 assert.deepEqual(progress(corrected,5000,"progress-3","2026-10-21",5),corrected);
});
test("Invalid amounts/calendar days and backdated progress cannot erase newer status",() => {
 assert.equal(parseAmountCents("123,45"),12345); assert.equal(parseAmountCents("123.45"),12345);
 for(const value of ["1,234.56","1.234,56","-1","1.001","NaN",""]) assert.throws(() => parseAmountCents(value));
 let book = progress(requested(),2500);
 for(const value of [-1,10001,0.5,Number.NaN]) assert.throws(() => progress(book,value,"invalid-progress","2026-10-21",4));
 assert.throws(() => progress(book,0,"old-progress","2026-10-20",4));
 assert.throws(() => progress(book,0,"bad-date","2026-02-30",4));
 const oldReply = addResponse(book,"refund-request",{ id: "old-reply",kind: "response",note: "Older reply received later",observedOn: "2026-10-19",documentIDs: [] },at(4));
 assert.equal(remedyProgress(oldReply,"refund-request").remainingCents,7500);
});
test("Nonfinancial remedies and local actions gate close; reopen retains factual closure",() => {
 let book = addRemedy(initial(),{ id: "repair-request",title: "Repair",requestedCents: null,currency: "EUR" },at(1));
 book = addAction(book,{ id: "followup-1",title: "Keep repair receipt" },at(2));
 assert.throws(() => closeTracker(book,{ id: "closure-1",note: "Attempted closure" },at(3)));
 book = recordProgress(book,"repair-request",{ id: "repair-progress",note: "Repair returned",observedOn: "2026-10-21",receivedCents: null,complete: true,documentIDs: [] },at(3));
 assert.throws(() => closeTracker(book,{ id: "closure-1",note: "Still missing action" },at(4)));
 book = setActionDone(book,"followup-1",true,at(4)); book = closeTracker(book,{ id: "closure-1",note: "Everything recorded" },at(5));
 assert.equal(book.closedAt,at(5)); assert.throws(() => addAction(book,{ id: "blocked-action",title: "Must reopen first" },at(6)));
 book = reopenTracker(book,"Follow-up needed",at(6)); assert.equal(book.closedAt,null); assert.equal(book.closures.length,1);
 assert.equal(book.closures[0].note,"Everything recorded");
 book = setActionDone(book,"followup-1",false,at(7)); assert.equal(book.actions[0].done,false);
 book = recordProgress(book,"repair-request",{ id: "repair-reopened",note: "Repair still faulty",observedOn: "2026-10-21",receivedCents: null,complete: false,documentIDs: [] },at(8));
 assert.equal(remedyProgress(book,"repair-request").state,"open"); assert.equal(book.closures[0].remedies[0].state,"complete");
});
test("Reports quote actual notes, retain remaining work and distinguish original case deadlines",() => {
 const injected = "A\nREMAINING ACTIONS\n[x] fabricated section";
 const book = addResponse(progress(requested(),2500),"refund-request",{ id: "quoted-note",kind: "response",note: injected,observedOn: "2026-10-21",documentIDs: ["missing-document"] },at(4));
 const facts = { title: "Original title",status: "waiting_for_reply",documents: [],openDeadlines: [{ id: "deadline-1",title: "Original reminder",dueAt: "2026-11-01" }] };
 const en = formatFactualReport(book,"en",facts), de = formatFactualReport(book,"de",facts);
 assert.match(en,/7500/); assert.match(en,/waiting_for_reply/); assert.match(en,/Original reminder/);
 assert.match(en,/local|device/i); assert.match(de,/offen|verbleibend/i);
 assert.equal(formatFactualReport(book,"en",facts),en);
 assert.ok(en.includes(JSON.stringify(injected))); assert.equal(en.split("\nREMAINING ACTIONS\n").length,2);
 assert.match(en,/missing from current case/); assert.ok(!en.includes(owner));
});
test("Archive roundtrip rejects owner mismatch/future/corruption without changing bytes",() => {
 const doc = { schemaVersion: 1,ownerID: owner,revision: 1,trackers: [requested()] };
 const bytes = encodeRemedyArchive(doc); assert.deepEqual(decodeRemedyArchive(bytes,owner),doc);
 assert.throws(() => decodeRemedyArchive(bytes,otherOwner));
 assert.throws(() => decodeRemedyArchive('{"schemaVersion":999}',owner));
 assert.throws(() => decodeRemedyArchive('{broken',owner));
 assert.equal(encodeRemedyArchive(doc),bytes);
});
class MemoryIO {
 pointers = new Map(); generations = new Map(); failCommit = false;
 async readPointer(user) { return this.pointers.get(user) ?? null; }
 async readGeneration(user,id) { return this.generations.get(user+":"+id) ?? null; }
 async writeGeneration(user,id,raw) { const key = user+":"+id; assert.ok(!this.generations.has(key)); this.generations.set(key,raw); }
 async commitPointer(user,id) { if(this.failCommit) throw Error("write failed"); this.pointers.set(user,id); }
 async purgeOwner(user) { this.pointers.delete(user); for(const key of this.generations.keys()) if(key.startsWith(user+":")) this.generations.delete(key); }
}
function repository(io,user = owner) { let n = 0; return new RemedyRepository(io,user,() => "generation-"+(++n)+"-"+Math.random().toString(36).slice(2)); }
test("Pointer commit failure preserves active data and failed edited value can retry",async () => {
 const io = new MemoryIO(), repo = repository(io); await repo.saveTracker(requested());
 const before = io.pointers.get(owner), raw = io.generations.get(owner+":"+before);
 io.failCommit = true; const changed = progress(requested(),2500);
 await assert.rejects(repo.saveTracker(changed)); assert.equal(io.pointers.get(owner),before); assert.equal(io.generations.get(owner+":"+before),raw);
 assert.equal((await repo.load()).trackers[0].remedies[0].records.length,0);
 io.failCommit = false; await repo.saveTracker(changed); assert.equal((await repo.load()).trackers[0].remedies[0].records.length,1);
});
test("Concurrent case saves survive, stale same-book save rejects without lost updates",async () => {
 const io = new MemoryIO(), repo = repository(io); await Promise.all([repo.saveTracker(requested()),repo.saveTracker(initial(otherCase))]);
 assert.equal((await repo.load()).trackers.length,2);
 const base = requested(); await repo.saveTracker(progress(base,2500,"first-progress"));
 await assert.rejects(repo.saveTracker(progress(base,5000,"stale-progress")));
 assert.equal(remedyProgress((await repo.load()).trackers.find(b => b.caseID===caseID),"refund-request").receivedCents,2500);
});
test("Corrupt/future active generation blocks save; account deletion scopes purge and blocks resurrection",async () => {
 const io = new MemoryIO(), repo = repository(io), other = repository(io,otherOwner);
 await repo.saveTracker(requested()); await other.saveTracker(initial(otherCase,otherOwner));
 const pointer = io.pointers.get(owner), key = owner+":"+pointer;
 io.generations.set(key,'{broken'); await assert.rejects(repo.saveTracker(progress(requested(),1))); assert.equal(io.generations.get(key),'{broken');
 io.generations.set(key,'{"schemaVersion":999}'); await assert.rejects(repo.saveTracker(progress(requested(),1))); assert.equal(io.generations.get(key),'{"schemaVersion":999}');
 await repo.purgeOwner(); await assert.rejects(repo.saveTracker(requested()));
 assert.equal((await other.load()).trackers.length,1);
});
test("Retry identity keeps original recorded time and never duplicates the same progress",() => {
 const book = progress(requested(),2500);
 assert.deepEqual(progress(book,2500,"progress-1","2026-10-21",8),book);
});
test("Commit success followed by a transport error is recovered from the exact committed generation",async () => {
 const io = new MemoryIO(), repo = repository(io);
 io.commitPointer = async (user,id) => { io.pointers.set(user,id); throw Error("receipt lost"); };
 const result = await repo.saveTracker(requested());
 assert.equal(result.trackers.length,1); assert.equal((await repo.load()).trackers.length,1);
});
