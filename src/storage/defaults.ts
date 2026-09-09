import type { Album, AppData, Settings } from '../types';

export const DATA_VERSION = 1;

export const defaultSettings: Settings = {
  appLockEnabled: false,
  biometricsEnabled: false,
  showHiddenMemories: false,
  memoryOfTheDayEnabled: true,
  slideshowSeconds: 3.5,
};

/**
 * The collections the app builds for you on day one. They stay in sync with
 * your memories automatically — nothing to file by hand.
 */
export function systemAlbums(now = Date.now()): Album[] {
  const make = (
    id: string,
    title: string,
    icon: string,
    rule: Album['rule'],
    order: number,
  ): Album => ({ id, title, icon, rule, system: true, createdAt: now, order });

  return [
    make('sys_first_date', 'Our First Date', 'heart-outline', { type: 'firstDay' }, 0),
    make('sys_trips', 'Trips Together', 'airplane-outline', { type: 'hasLocation' }, 1),
    make('sys_birthdays', 'Birthdays', 'gift-outline', { type: 'birthdays' }, 2),
    make('sys_anniversaries', 'Anniversaries', 'infinite-outline', { type: 'anniversary' }, 3),
    make('sys_funny', 'Funny Videos', 'happy-outline', { type: 'videos' }, 4),
    make('sys_random', 'Random Happy Moments', 'sparkles-outline', { type: 'uncategorized' }, 5),
    make('sys_favorites', 'Our Favorites', 'star-outline', { type: 'favorites' }, 6),
  ];
}

export function emptyData(now = Date.now()): AppData {
  return {
    version: DATA_VERSION,
    couple: null,
    memories: [],
    albums: systemAlbums(now),
    notes: [],
    countdowns: [],
    story: [],
    settings: { ...defaultSettings },
    momentTitles: {},
    meId: null,
    onboarded: false,
  };
}
