import { decodeRemedyArchive, encodeRemedyArchive, normalizeOwnerID, RemedyError, validateTracker, type RemedyArchive, type RemedyTracker } from "./remedy-tracker.ts";

export interface RemedyIO {
  readPointer(ownerID: string): Promise<string | null>;
  readGeneration(ownerID: string,generation: string): Promise<string | null>;
  writeGeneration(ownerID: string,generation: string,raw: string): Promise<void>;
  commitPointer(ownerID: string,generation: string): Promise<void>;
  purgeOwner(ownerID: string): Promise<void>;
}
type OwnerQueue = { tail: Promise<unknown>; deleted: boolean };
const queues = new WeakMap<RemedyIO,Map<string,OwnerQueue>>();
function queue(io: RemedyIO,owner: string): OwnerQueue {
  let owners = queues.get(io); if (!owners) { owners = new Map(); queues.set(io,owners); }
  let state = owners.get(owner); if (!state) { state = { tail: Promise.resolve(),deleted: false }; owners.set(owner,state); }
  return state;
}
function generationID() { return "generation-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2); }
function validGeneration(value: string) { return /^[a-zA-Z0-9_-]{4,120}$/.test(value); }
export class RemedyRepository {
  readonly ownerID: string;
  private readonly io: RemedyIO;
  private readonly nextGeneration: () => string;
  constructor(io: RemedyIO,ownerID: string,nextGeneration: () => string = generationID) {
    this.io = io; this.ownerID = normalizeOwnerID(ownerID); this.nextGeneration = nextGeneration;
  }
  async load(): Promise<RemedyArchive> {
    const pointer = await this.io.readPointer(this.ownerID);
    if (pointer === null) return { schemaVersion: 1,ownerID: this.ownerID,revision: 0,trackers: [] };
    if (!validGeneration(pointer)) throw new RemedyError("corrupt");
    const raw = await this.io.readGeneration(this.ownerID,pointer);
    if (raw === null) throw new RemedyError("corrupt");
    return decodeRemedyArchive(raw,this.ownerID);
  }
  saveTracker(book: RemedyTracker): Promise<RemedyArchive> {
    const state = queue(this.io,this.ownerID);
    const work = state.tail.catch(() => undefined).then(async () => {
      if (state.deleted) throw new RemedyError("deleted");
      validateTracker(book); if (book.ownerID !== this.ownerID) throw new RemedyError("owner");
      const current = await this.load(), existing = current.trackers.find(b => b.caseID === book.caseID);
      if (existing) {
        if (JSON.stringify(existing) === JSON.stringify(book)) return current;
        if (book.revision !== existing.revision + 1 || book.updatedAt < existing.updatedAt) throw new RemedyError("conflict");
      }
      const next: RemedyArchive = { ...current,revision: current.revision + 1,trackers: existing ? current.trackers.map(b => b.caseID === book.caseID ? book : b) : [...current.trackers,book] };
      const raw = encodeRemedyArchive(next), generation = this.nextGeneration();
      if (!validGeneration(generation)) throw new RemedyError("invalid");
      await this.io.writeGeneration(this.ownerID,generation,raw);
      const verified = await this.io.readGeneration(this.ownerID,generation);
      if (verified !== raw) throw new RemedyError("corrupt");
      decodeRemedyArchive(verified,this.ownerID);
      try { await this.io.commitPointer(this.ownerID,generation); }
      catch (cause) {
        // A platform commit can succeed before its acknowledgement is lost.
        // Recover only the exact, verified generation; never infer success.
        try {
          if (await this.io.readPointer(this.ownerID) !== generation || await this.io.readGeneration(this.ownerID,generation) !== raw) throw cause;
        } catch { throw cause; }
      }
      if (await this.io.readPointer(this.ownerID) !== generation) throw new RemedyError("conflict");
      return next;
    });
    state.tail = work; return work;
  }
  purgeOwner(): Promise<void> {
    const state = queue(this.io,this.ownerID); state.deleted = true;
    const work = state.tail.catch(() => undefined).then(() => this.io.purgeOwner(this.ownerID));
    state.tail = work; return work;
  }
}
