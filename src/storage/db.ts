/**
 * Local-first store. Everything lives on the device: the memory index in
 * AsyncStorage, the media files themselves in the app's private documents
 * directory. Nothing is uploaded anywhere.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData } from '../types';
import { DATA_VERSION, emptyData, systemAlbums } from './defaults';

const KEY = '@us_our_story/data/v1';

let writeQueue: Promise<void> = Promise.resolve();

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyData();
    return migrate(JSON.parse(raw) as AppData);
  } catch (err) {
    console.warn('[db] load failed, starting fresh', err);
    return emptyData();
  }
}

/**
 * Writes are serialized so two quick edits can never interleave and lose one
 * another — an import of 300 photos fires a lot of state updates.
 */
export function saveData(data: AppData): Promise<void> {
  writeQueue = writeQueue
    .then(() => AsyncStorage.setItem(KEY, JSON.stringify(data)))
    .catch(err => console.warn('[db] save failed', err));
  return writeQueue;
}

export async function clearData(): Promise<void> {
  await writeQueue;
  await AsyncStorage.removeItem(KEY);
}

function migrate(data: Partial<AppData>): AppData {
  const base = emptyData();
  const merged: AppData = {
    ...base,
    ...data,
    version: DATA_VERSION,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    memories: data.memories ?? [],
    albums: data.albums ?? base.albums,
    notes: data.notes ?? [],
    countdowns: data.countdowns ?? [],
    story: data.story ?? [],
    momentTitles: data.momentTitles ?? {},
    meId: data.meId ?? null,
  };

  // Make sure a system album added in a later release shows up for existing users.
  const have = new Set(merged.albums.map(a => a.id));
  const missing = systemAlbums().filter(a => !have.has(a.id));
  if (missing.length) merged.albums = [...merged.albums, ...missing];

  return merged;
}
