import test from "node:test";
import assert from "node:assert/strict";
import { createRemedyIO } from "../src/remedy-io.ts";
import { RemedyRepository } from "../src/remedy-storage.ts";
import { createTracker, utf8Bytes } from "../src/remedy-tracker.ts";
const user = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";
const caseID = "00000000-0000-4000-8000-000000000003";
const at = "2026-10-21T10:00:00.000Z";
class NativeMemory {
 rootURI = "app://documents/"; files = new Map(); directories = new Set(); secure = new Map([["reklaio.mobile.session","LEGACY_TOKEN"]]); failWrite = false; failPointer = false;
 info = async uri => this.files.has(uri) ? { exists: true,isDirectory: false,size: utf8Bytes(this.files.get(uri)) } : { exists: this.directories.has(uri),isDirectory: true };
 readText = async uri => { assert.ok(this.files.has(uri)); return this.files.get(uri); };
 writeText = async (uri,text) => { this.files.set(uri,this.failWrite ? "partial" : text); if(this.failWrite) throw Error("disk failed"); };
 makeDirectory = async uri => { this.directories.add(uri); };
 readDirectory = async uri => [...this.files.keys()].filter(k => k.startsWith(uri)).map(k => k.slice(uri.length));
 remove = async uri => { for(const key of this.files.keys()) if(key === uri || (uri.endsWith("/") && key.startsWith(uri))) this.files.delete(key); this.directories.delete(uri); };
 readSecure = async key => this.secure.get(key) ?? null;
 writeSecure = async (key,value) => { if(this.failPointer) throw Error("keychain failed"); this.secure.set(key,value); };
 deleteSecure = async key => { this.secure.delete(key); };
}
function setup() { const native = new NativeMemory(); const io = createRemedyIO(native); let n=0; return { native,io,repo: new RemedyRepository(io,user,() => "generation-"+(++n)) }; }
test("Native generation adapter verifies restart, bounds old generations and scopes deletion",async () => {
 const { native,io,repo } = setup();
 await repo.saveTracker(createTracker(user,caseID,"Own case",at));
 assert.equal((await new RemedyRepository(io,user).load()).trackers.length,1);
 await new RemedyRepository(io,other).saveTracker(createTracker(other,caseID,"Other case",at));
 await repo.purgeOwner(); assert.equal((await new RemedyRepository(io,other).load()).trackers.length,1);
 assert.equal(native.secure.get("reklaio.mobile.session"),"LEGACY_TOKEN");
});
test("First-write and first-pointer failures clean only uncommitted bytes and remain retryable",async () => {
 const { native,repo } = setup(); const book = createTracker(user,caseID,"Own case",at);
 native.failWrite = true; await assert.rejects(repo.saveTracker(book)); assert.equal(native.files.size,0);
 native.failWrite = false; native.failPointer = true; await assert.rejects(repo.saveTracker(book)); assert.equal(native.files.size,0);
 native.failPointer = false; await repo.saveTracker(book); assert.equal((await repo.load()).trackers.length,1);
});
test("A missing secure pointer with existing generation bytes is never treated as an empty archive",async () => {
 const { native,repo } = setup(); await repo.saveTracker(createTracker(user,caseID,"Own case",at));
 for(const key of native.secure.keys()) if(key !== "reklaio.mobile.session") native.secure.delete(key);
 const before = [...native.files.entries()]; await assert.rejects(repo.load()); await assert.rejects(repo.saveTracker(createTracker(user,caseID,"Own case",at)));
 assert.deepEqual([...native.files.entries()],before);
});
