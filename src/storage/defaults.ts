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
    caption: string,
    accent: string,
  ): Album => ({ id, title, icon, rule, system: true, createdAt: now, order, caption, accent });

  return [
    // prettier-ignore
    make('sys_first_date', 'Our First Date', 'heart-outline', { type: 'firstDay' }, 0, 'Where it all began', '#E98CA3'),
    // prettier-ignore
    make('sys_trips', 'Trips Together', 'airplane-outline', { type: 'hasLocation' }, 1, "Places we've been", '#9B8CE9'),
    // prettier-ignore
    make('sys_birthdays', 'Birthdays', 'gift-outline', { type: 'birthdays' }, 2, 'More candles, more memories', '#E9A76C'),
    // prettier-ignore
    make('sys_anniversaries', 'Anniversaries', 'infinite-outline', { type: 'anniversary' }, 3, 'Another year with you', '#D06E88'),
    // prettier-ignore
    make('sys_funny', 'Funny Videos', 'happy-outline', { type: 'videos' }, 4, 'Laughing together, always', '#6CC5C0'),
    // prettier-ignore
    make('sys_random', 'Random Happy Moments', 'sparkles-outline', { type: 'uncategorized' }, 5, 'Just us', '#7FBF9B'),
    // prettier-ignore
    make('sys_favorites', 'Our Favorites', 'star-outline', { type: 'favorites' }, 6, 'Things we both love', '#E4C08A'),
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
