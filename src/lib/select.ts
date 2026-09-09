/**
 * Derived views over the memory list. Nothing here is stored — the timeline,
 * the moments and the auto albums are all recomputed from the memories
 * themselves, so they stay correct no matter how a memory got added.
 */
import type { Album, AppData, Couple, Memory, Moment } from '../types';
import { DAY_MS, fmtMonthYear, fmtRange } from './date';

/** A gap larger than this starts a new moment. */
export const MOMENT_GAP_DAYS = 2;

export function visibleMemories(data: AppData): Memory[] {
  const list = data.settings.showHiddenMemories
    ? data.memories
    : data.memories.filter(m => !m.hidden);
  return [...list].sort((a, b) => b.takenAt - a.takenAt);
}

export function byOldestFirst(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => a.takenAt - b.takenAt);
}

/**
 * Groups memories into date clusters — the app's "moments".
 * A run of photos from one weekend becomes one card; a two-week trip becomes
 * one card with its own date range and place.
 */
export function buildMoments(memories: Memory[], titles: Record<string, string> = {}): Moment[] {
  if (!memories.length) return [];
  const sorted = byOldestFirst(memories);
  const clusters: Memory[][] = [];
  let current: Memory[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].takenAt - sorted[i - 1].takenAt;
    if (gap > MOMENT_GAP_DAYS * DAY_MS) {
      clusters.push(current);
      current = [sorted[i]];
    } else {
      current.push(sorted[i]);
    }
  }
  clusters.push(current);

  return clusters
    .map<Moment>(group => {
      const startAt = group[0].takenAt;
      const endAt = group[group.length - 1].takenAt;
      const id = `mom_${startAt}`;
      const location = pickLocation(group);
      const photoCount = group.filter(m => m.kind === 'photo').length;
      return {
        id,
        title: titles[id] ?? autoTitle(group, startAt, endAt, location),
        startAt,
        endAt,
        location,
        memories: [...group].sort((a, b) => a.takenAt - b.takenAt),
        photoCount,
        videoCount: group.length - photoCount,
      };
    })
    .sort((a, b) => b.startAt - a.startAt);
}

/** The most common location in a cluster wins the label. */
function pickLocation(group: Memory[]): string | undefined {
  const counts = new Map<string, number>();
  group.forEach(m => {
    if (m.location) counts.set(m.location, (counts.get(m.location) ?? 0) + 1);
  });
  let best: string | undefined;
  let bestCount = 0;
  counts.forEach((count, place) => {
    if (count > bestCount) {
      best = place;
      bestCount = count;
    }
  });
  return best;
}

function autoTitle(group: Memory[], startAt: number, endAt: number, location?: string): string {
  const spansDays = endAt - startAt > DAY_MS;
  if (location) return spansDays ? `Our Trip to ${location}` : location;
  const captioned = group.find(m => m.caption && m.caption.length <= 40);
  if (captioned?.caption) return captioned.caption;
  if (spansDays) return `Days Together • ${fmtRange(startAt, endAt)}`;
  return fmtMonthYear(startAt);
}

/** Resolves an album — system rules are computed, custom albums use their tags. */
export function albumMemories(album: Album, memories: Memory[], couple: Couple | null): Memory[] {
  const sorted = [...memories].sort((a, b) => b.takenAt - a.takenAt);
  const rule = album.rule;

  switch (rule.type) {
    case 'favorites':
      return sorted.filter(m => m.favorite);

    case 'hasLocation':
      return sorted.filter(m => !!m.location);

    case 'videos':
      return sorted.filter(m => m.kind === 'video');

    case 'firstDay': {
      if (!sorted.length) return [];
      const first = new Date(sorted[sorted.length - 1].takenAt);
      return sorted.filter(m => sameCalendarDay(new Date(m.takenAt), first));
    }

    case 'dateMatch':
      return sorted.filter(m => {
        const d = new Date(m.takenAt);
        return d.getMonth() === rule.month && d.getDate() === rule.day;
      });

    case 'anniversary': {
      if (!couple?.togetherSince) return taggedWith(album.id, sorted);
      const src = new Date(couple.togetherSince);
      const auto = sorted.filter(m => sameMonthDay(new Date(m.takenAt), src));
      return mergeUnique(auto, taggedWith(album.id, sorted));
    }

    case 'birthdays': {
      const days = (couple?.members ?? [])
        .map(m => m.birthday)
        .filter((b): b is number => typeof b === 'number')
        .map(b => new Date(b));
      const auto = days.length
        ? sorted.filter(m => days.some(d => sameMonthDay(new Date(m.takenAt), d)))
        : [];
      return mergeUnique(auto, taggedWith(album.id, sorted));
    }

    case 'uncategorized':
      return sorted.filter(m => !m.favorite && !m.location && m.albumIds.length === 0);

    case 'manual':
    default:
      return taggedWith(album.id, sorted);
  }
}

function taggedWith(albumId: string, memories: Memory[]): Memory[] {
  return memories.filter(m => m.albumIds.includes(albumId));
}

function mergeUnique(a: Memory[], b: Memory[]): Memory[] {
  const seen = new Set(a.map(m => m.id));
  return [...a, ...b.filter(m => !seen.has(m.id))].sort((x, y) => y.takenAt - x.takenAt);
}

export function sameMonthDay(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Memories from this same day in earlier years — powers "3 years ago today". */
export function memoriesOnThisDay(memories: Memory[], now = Date.now()): Memory[] {
  const today = new Date(now);
  return memories
    .filter(m => {
      const d = new Date(m.takenAt);
      return sameMonthDay(d, today) && d.getFullYear() < today.getFullYear();
    })
    .sort((a, b) => b.takenAt - a.takenAt);
}

export interface YearStats {
  year: number;
  photos: number;
  videos: number;
  moments: number;
  daysTogether: number;
  places: string[];
  favorites: number;
  memories: Memory[];
}

export function yearStats(data: AppData, year: number, now = Date.now()): YearStats {
  const memories = visibleMemories(data).filter(m => new Date(m.takenAt).getFullYear() === year);
  const moments = buildMoments(memories, data.momentTitles);
  const places = Array.from(new Set(memories.map(m => m.location).filter(Boolean) as string[]));
  const since = data.couple?.togetherSince;
  const daysTogether = since
    ? Math.max(0, Math.floor((Math.min(now, endOfYear(year)) - since) / DAY_MS))
    : new Set(memories.map(m => new Date(m.takenAt).toDateString())).size;

  return {
    year,
    photos: memories.filter(m => m.kind === 'photo').length,
    videos: memories.filter(m => m.kind === 'video').length,
    moments: moments.length,
    daysTogether,
    places,
    favorites: memories.filter(m => m.favorite).length,
    memories,
  };
}

function endOfYear(year: number): number {
  return new Date(year, 11, 31, 23, 59, 59, 999).getTime();
}

export function yearsWithMemories(memories: Memory[]): number[] {
  const set = new Set(memories.map(m => new Date(m.takenAt).getFullYear()));
  return Array.from(set).sort((a, b) => b - a);
}

/**
 * Picks the highlights for the year movie: favorites first, then a spread
 * across the year's moments so the reel is not all one weekend.
 */
export function reelSelection(stats: YearStats, max = 60): Memory[] {
  const moments = buildMoments(stats.memories);
  const picked: Memory[] = [];
  const seen = new Set<string>();

  const take = (m?: Memory) => {
    if (!m || seen.has(m.id) || picked.length >= max) return;
    seen.add(m.id);
    picked.push(m);
  };

  stats.memories.filter(m => m.favorite).forEach(take);

  for (let round = 0; round < 40 && picked.length < max; round++) {
    let added = false;
    for (const moment of moments) {
      if (moment.memories[round]) {
        take(moment.memories[round]);
        added = true;
      }
    }
    if (!added) break;
  }

  return picked.sort((a, b) => a.takenAt - b.takenAt);
}
