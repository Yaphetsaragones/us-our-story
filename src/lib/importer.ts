/**
 * Everything that turns device media into memories: the gallery picker, the
 * camera, and Auto Sync (a sweep of the camera roll for anything new).
 */
import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import type { MediaKind } from '../types';
import type { MemoryInput } from '../context/AppContext';

/** Android 13 split the old storage permission into per-type media reads. */
async function requestAndroidMediaPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const api = Platform.Version as number;

  if (api >= 33) {
    const wanted = [
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    ];
    if (api >= 34) {
      // Android 14 lets people grant access to a chosen subset only.
      wanted.push(
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED' as (typeof wanted)[number],
      );
    }
    const result = await PermissionsAndroid.requestMultiple(wanted);
    return Object.values(result).some(v => v === PermissionsAndroid.RESULTS.GRANTED);
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function ensureMediaPermission(): Promise<boolean> {
  try {
    return await requestAndroidMediaPermission();
  } catch {
    return false;
  }
}

export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function kindOf(asset: Asset): MediaKind {
  if (asset.type?.startsWith('video')) return 'video';
  if (asset.duration && asset.duration > 0) return 'video';
  return 'photo';
}

/** The picker reports the original capture time when `includeExtra` is on. */
function takenAtOf(asset: Asset): number {
  if (asset.timestamp) {
    const parsed = Date.parse(asset.timestamp);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function toInput(asset: Asset): MemoryInput | null {
  if (!asset.uri) return null;
  const kind = kindOf(asset);
  return {
    uri: asset.uri,
    kind,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ? Math.round(asset.duration * 1000) : undefined,
    fileSize: asset.fileSize,
    fileName: asset.fileName ?? undefined,
    takenAt: takenAtOf(asset),
    sourceId: asset.id ?? undefined,
  };
}

/** Multi-select from the gallery. `selectionLimit: 0` means "as many as you like". */
export async function pickFromLibrary(): Promise<MemoryInput[]> {
  if (!(await ensureMediaPermission())) return [];

  const options: ImageLibraryOptions = {
    mediaType: 'mixed',
    selectionLimit: 0,
    includeExtra: true,
    presentationStyle: 'fullScreen',
  };

  const response = await launchImageLibrary(options);
  if (response.didCancel || response.errorCode) return [];
  return (response.assets ?? []).map(toInput).filter((x): x is MemoryInput => x !== null);
}

export async function captureNew(kind: MediaKind): Promise<MemoryInput[]> {
  if (!(await ensureCameraPermission())) return [];

  const options: CameraOptions = {
    mediaType: kind === 'video' ? 'video' : 'photo',
    includeExtra: true,
    saveToPhotos: false,
    videoQuality: 'high',
  };

  const response = await launchCamera(options);
  if (response.didCancel || response.errorCode) return [];
  return (response.assets ?? []).map(toInput).filter((x): x is MemoryInput => x !== null);
}

interface CameraRollNode {
  type?: string;
  timestamp?: number;
  location?: { latitude?: number; longitude?: number } | null;
  image: {
    uri: string;
    filename?: string | null;
    height?: number;
    width?: number;
    fileSize?: number | null;
    playableDuration?: number | null;
  };
}

/**
 * Auto Sync: pulls in camera-roll items newer than the last sweep.
 * Existing memories are matched on `sourceId`, so re-running never duplicates.
 */
export async function autoSyncRecent(sinceMs = 0, limit = 200): Promise<MemoryInput[]> {
  if (!(await ensureMediaPermission())) return [];

  try {
    const page = await CameraRoll.getPhotos({
      first: limit,
      assetType: 'All',
      include: ['filename', 'fileSize', 'imageSize', 'playableDuration'],
    });

    const inputs: MemoryInput[] = [];
    for (const edge of page.edges) {
      const node = edge.node as unknown as CameraRollNode;
      // camera-roll reports seconds since epoch.
      const takenAt = node.timestamp ? Math.round(node.timestamp * 1000) : Date.now();
      if (takenAt <= sinceMs) continue;

      const isVideo = node.type?.startsWith('video') || (node.image.playableDuration ?? 0) > 0;
      inputs.push({
        uri: node.image.uri,
        kind: isVideo ? 'video' : 'photo',
        width: node.image.width,
        height: node.image.height,
        fileSize: node.image.fileSize ?? undefined,
        fileName: node.image.filename ?? undefined,
        durationMs: node.image.playableDuration
          ? Math.round(node.image.playableDuration * 1000)
          : undefined,
        takenAt,
        sourceId: node.image.uri,
      });
    }
    return inputs;
  } catch (err) {
    console.warn('[importer] auto sync failed', err);
    return [];
  }
}
