/**
 * Media lives in the app's private documents directory, so a memory survives
 * you clearing the phone's cache or deleting the original from the gallery.
 * If a copy can't be made we keep the original URI rather than lose the memory.
 */
import { Platform } from 'react-native';
import {
  DocumentDirectoryPath,
  copyFile,
  exists,
  mkdir,
  stat,
  unlink,
} from '@dr.pogodin/react-native-fs';
import type { MediaKind } from '../types';

export const MEDIA_DIR = `${DocumentDirectoryPath}/memories`;

let dirReady: Promise<void> | null = null;

export function ensureMediaDir(): Promise<void> {
  if (!dirReady) {
    dirReady = mkdir(MEDIA_DIR).catch(err => {
      console.warn('[media] mkdir failed', err);
    });
  }
  return dirReady;
}

function extensionFor(uri: string, kind: MediaKind, fileName?: string): string {
  const fromName = fileName?.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1];
  const fromUri = uri.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/)?.[1];
  const ext = (fromName || fromUri || '').toLowerCase();
  if (ext) return ext;
  return kind === 'video' ? 'mp4' : 'jpg';
}

/** Anything the picker hands back that we can't copy is still displayable as-is. */
function isCopyable(uri: string): boolean {
  if (uri.startsWith('ph://') || uri.startsWith('assets-library://')) return false;
  return true;
}

/**
 * Copies a picked file into the app's own storage.
 * Returns the URI to store on the memory — the copy when it worked, the
 * original otherwise.
 */
export async function persistMedia(
  uri: string,
  kind: MediaKind,
  id: string,
  fileName?: string,
): Promise<string> {
  if (!isCopyable(uri)) return uri;
  try {
    await ensureMediaDir();
    const dest = `${MEDIA_DIR}/${id}.${extensionFor(uri, kind, fileName)}`;
    if (await exists(dest)) return `file://${dest}`;
    const source = Platform.OS === 'android' ? uri : uri.replace(/^file:\/\//, '');
    await copyFile(source, dest);
    return `file://${dest}`;
  } catch (err) {
    console.warn('[media] copy failed, keeping original uri', err);
    return uri;
  }
}

/** Only removes files we own — never touches the user's gallery. */
export async function deleteMedia(uri: string): Promise<void> {
  if (!uri.includes(MEDIA_DIR)) return;
  try {
    const path = uri.replace(/^file:\/\//, '');
    if (await exists(path)) await unlink(path);
  } catch (err) {
    console.warn('[media] delete failed', err);
  }
}

export async function mediaSize(uri: string): Promise<number> {
  try {
    const info = await stat(uri.replace(/^file:\/\//, ''));
    return Number(info.size) || 0;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
