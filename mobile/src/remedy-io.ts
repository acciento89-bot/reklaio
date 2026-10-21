import { MAX_REMEDY_ARCHIVE_BYTES, normalizeOwnerID, RemedyError, utf8Bytes } from "./remedy-tracker.ts";
import type { RemedyIO } from "./remedy-storage.ts";

export interface RemedyPlatform {
  readonly rootURI: string;
  info(uri: string): Promise<{ exists: boolean; isDirectory?: boolean; size?: number }>;
  readText(uri: string): Promise<string>;
  writeText(uri: string,text: string): Promise<void>;
  makeDirectory(uri: string): Promise<void>;
  readDirectory(uri: string): Promise<string[]>;
  remove(uri: string): Promise<void>;
  readSecure(key: string): Promise<string | null>;
  writeSecure(key: string,value: string): Promise<void>;
  deleteSecure(key: string): Promise<void>;
}
const validGeneration = (value: string) => /^[a-zA-Z0-9_-]{4,120}$/.test(value);
export function createRemedyIO(platform: RemedyPlatform): RemedyIO {
  const folder = (owner: string) => `${platform.rootURI}reklaio-remedies-v1/${normalizeOwnerID(owner)}/`;
  const key = (owner: string) => `reklaio.remedies.v1.${normalizeOwnerID(owner)}`;
  const file = (owner: string,generation: string) => {
    if (!validGeneration(generation)) throw new RemedyError("corrupt");
    return folder(owner)+generation+".json";
  };
  const names = async (owner: string) => (await platform.info(folder(owner))).exists ? platform.readDirectory(folder(owner)) : [];
  return {
    async readPointer(owner) {
      const pointer = await platform.readSecure(key(owner));
      if (pointer === null && (await names(owner)).some(name => name.endsWith(".json"))) throw new RemedyError("corrupt");
      return pointer;
    },
    async readGeneration(owner,generation) {
      const uri = file(owner,generation), info = await platform.info(uri);
      if (!info.exists) return null;
      if (info.isDirectory || (info.size !== undefined && info.size > MAX_REMEDY_ARCHIVE_BYTES)) throw new RemedyError("corrupt");
      const raw = await platform.readText(uri);
      if (utf8Bytes(raw) > MAX_REMEDY_ARCHIVE_BYTES) throw new RemedyError("corrupt");
      return raw;
    },
    async writeGeneration(owner,generation,raw) {
      const uri = file(owner,generation);
      if (utf8Bytes(raw) > MAX_REMEDY_ARCHIVE_BYTES) throw new RemedyError("invalid");
      await platform.makeDirectory(folder(owner));
      if ((await platform.info(uri)).exists) throw new RemedyError("conflict");
      try { await platform.writeText(uri,raw); }
      catch (cause) { await platform.remove(uri).catch(() => undefined); throw cause; }
    },
    async commitPointer(owner,generation) {
      const uri = file(owner,generation), previous = await platform.readSecure(key(owner));
      try { await platform.writeSecure(key(owner),generation); }
      catch (cause) {
        // Remove only a definitely uncommitted generation. An unknown receipt
        // must preserve bytes so the repository can recover a confirmed commit.
        try { if (await platform.readSecure(key(owner)) !== generation) await platform.remove(uri); } catch { /* preserve on uncertainty */ }
        throw cause;
      }
      try {
        const keep = new Set([generation,previous]);
        for (const name of await names(owner)) {
          if (name.endsWith(".json") && validGeneration(name.slice(0,-5)) && !keep.has(name.slice(0,-5))) await platform.remove(folder(owner)+name);
        }
      } catch { /* committed save remains successful if old-generation cleanup fails */ }
    },
    async purgeOwner(owner) {
      const results = await Promise.allSettled([platform.remove(folder(owner)),platform.deleteSecure(key(owner))]);
      const failure = results.find(result => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    }
  };
}
