import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { createRemedyIO, type RemedyPlatform } from "./remedy-io";
import { RemedyRepository } from "./remedy-storage";

const platform: RemedyPlatform = {
  get rootURI() {
    if (!FileSystem.documentDirectory) throw new Error("Local document storage unavailable");
    return FileSystem.documentDirectory;
  },
  info: uri => FileSystem.getInfoAsync(uri),
  readText: uri => FileSystem.readAsStringAsync(uri),
  writeText: (uri,text) => FileSystem.writeAsStringAsync(uri,text),
  makeDirectory: uri => FileSystem.makeDirectoryAsync(uri,{ intermediates: true }),
  readDirectory: uri => FileSystem.readDirectoryAsync(uri),
  remove: uri => FileSystem.deleteAsync(uri,{ idempotent: true }),
  readSecure: key => SecureStore.getItemAsync(key),
  writeSecure: (key,value) => SecureStore.setItemAsync(key,value,{ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  deleteSecure: key => SecureStore.deleteItemAsync(key)
};
// One IO instance shares per-account serialization across mounted screens.
const io = createRemedyIO(platform);
export const createLocalRemedyRepository = (ownerID: string) => new RemedyRepository(io,ownerID);
export const purgeLocalRemedies = (ownerID: string) => createLocalRemedyRepository(ownerID).purgeOwner();
