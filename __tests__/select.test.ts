/**
 * The organizing logic is what makes the app feel smart, so it is the part
 * worth pinning down: clustering, album rules, "on this day" and the reel.
 */
import {
  albumMemories,
  buildMoments,
  memoriesOnThisDay,
  reelSelection,
  yearStats,
} from '../src/lib/select';
import { emptyData, systemAlbums } from '../src/storage/defaults';
import { DAY_MS } from '../src/lib/date';
import type { Album, Couple, Memory } from '../src/types';

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

function memory(partial: Partial<Memory> & { id: string; takenAt: number }): Memory {
  return {
    uri: `file:///memories/${partial.id}.jpg`,
    kind: 'photo',
    addedAt: partial.takenAt,
    addedBy: 'me',
    favorite: false,
    hidden: false,
    albumIds: [],
    ...partial,
  };
}

const album = (id: string) => systemAlbums().find(a => a.id === id) as Album;

describe('buildMoments', () => {
  it('groups a run of consecutive days into one moment', () => {
    const trip = [
      memory({ id: 'a', takenAt: day(2024, 8, 12) }),
      memory({ id: 'b', takenAt: day(2024, 8, 13) }),
      memory({ id: 'c', takenAt: day(2024, 8, 14) }),
    ];

    const moments = buildMoments(trip);

    expect(moments).toHaveLength(1);
    expect(moments[0].memories).toHaveLength(3);
    expect(moments[0].photoCount).toBe(3);
    expect(moments[0].videoCount).toBe(0);
  });

  it('splits when the gap runs past two days', () => {
    const moments = buildMoments([
      memory({ id: 'a', takenAt: day(2024, 8, 12) }),
      memory({ id: 'b', takenAt: day(2024, 8, 20) }),
    ]);

    expect(moments).toHaveLength(2);
    // Newest moment leads.
    expect(moments[0].startAt).toBeGreaterThan(moments[1].startAt);
  });

  it('names a multi-day cluster after the place most of it happened in', () => {
    const moments = buildMoments([
      memory({ id: 'a', takenAt: day(2024, 8, 12), location: 'Palawan' }),
      memory({ id: 'b', takenAt: day(2024, 8, 13), location: 'Palawan' }),
      memory({ id: 'c', takenAt: day(2024, 8, 14), location: 'Manila' }),
    ]);

    expect(moments[0].location).toBe('Palawan');
    expect(moments[0].title).toBe('Our Trip to Palawan');
  });

  it('honours a title the couple set by hand', () => {
    const items = [memory({ id: 'a', takenAt: day(2024, 8, 12) })];
    const id = `mom_${items[0].takenAt}`;

    expect(buildMoments(items, { [id]: 'Our First Date' })[0].title).toBe('Our First Date');
  });

  it('counts videos separately', () => {
    const moments = buildMoments([
      memory({ id: 'a', takenAt: day(2024, 8, 12) }),
      memory({ id: 'b', takenAt: day(2024, 8, 12, 14), kind: 'video', durationMs: 4000 }),
    ]);

    expect(moments[0].photoCount).toBe(1);
    expect(moments[0].videoCount).toBe(1);
  });

  it('returns nothing for an empty library', () => {
    expect(buildMoments([])).toEqual([]);
  });
});

describe('albumMemories', () => {
  const couple: Couple = {
    id: 'c1',
    title: 'Us',
    inviteCode: 'ABCD-1234',
    togetherSince: day(2020, 2, 14),
    createdAt: 0,
    members: [
      { id: 'm1', name: 'A', role: 'owner', joinedAt: 0, color: '#fff', birthday: day(1996, 5, 3) },
      { id: 'm2', name: 'B', role: 'partner', joinedAt: 0, color: '#fff' },
    ],
  };

  const library = [
    memory({ id: 'fav', takenAt: day(2024, 1, 5), favorite: true }),
    memory({ id: 'place', takenAt: day(2024, 3, 9), location: 'Palawan' }),
    memory({ id: 'clip', takenAt: day(2024, 4, 2), kind: 'video' }),
    memory({ id: 'anniv', takenAt: day(2024, 2, 14) }),
    memory({ id: 'bday', takenAt: day(2024, 5, 3) }),
    memory({ id: 'plain', takenAt: day(2024, 6, 1) }),
  ];

  it('collects favorites', () => {
    expect(albumMemories(album('sys_favorites'), library, couple).map(m => m.id)).toEqual(['fav']);
  });

  it('collects anything with a place into Trips Together', () => {
    expect(albumMemories(album('sys_trips'), library, couple).map(m => m.id)).toEqual(['place']);
  });

  it('collects videos into Funny Videos', () => {
    expect(albumMemories(album('sys_funny'), library, couple).map(m => m.id)).toEqual(['clip']);
  });

  it('matches Anniversaries against the together-since day', () => {
    expect(albumMemories(album('sys_anniversaries'), library, couple).map(m => m.id)).toEqual([
      'anniv',
    ]);
  });

  it("matches Birthdays against a member's birthday", () => {
    expect(albumMemories(album('sys_birthdays'), library, couple).map(m => m.id)).toEqual(['bday']);
  });

  it('takes the whole earliest day as Our First Date', () => {
    const withTwoOnDayOne = [
      ...library,
      memory({ id: 'fav2', takenAt: day(2024, 1, 5, 20) }),
      memory({ id: 'later', takenAt: day(2024, 1, 6) }),
    ];
    const ids = albumMemories(album('sys_first_date'), withTwoOnDayOne, couple)
      .map(m => m.id)
      .sort();

    expect(ids).toEqual(['fav', 'fav2']);
  });

  it('leaves only untagged, unplaced, unfavorited items in Random Happy Moments', () => {
    const ids = albumMemories(album('sys_random'), library, couple).map(m => m.id);

    expect(ids).toContain('plain');
    expect(ids).not.toContain('fav');
    expect(ids).not.toContain('place');
  });

  it('falls back to hand-filed memories when no together-since date is set', () => {
    const single = { ...couple, togetherSince: undefined };
    const tagged = [memory({ id: 'tagged', takenAt: day(2024, 9, 9), albumIds: ['sys_anniversaries'] })];

    expect(albumMemories(album('sys_anniversaries'), tagged, single).map(m => m.id)).toEqual([
      'tagged',
    ]);
  });
});

describe('memoriesOnThisDay', () => {
  it('finds the same calendar day in earlier years only', () => {
    const now = day(2026, 8, 15);
    const found = memoriesOnThisDay(
      [
        memory({ id: 'threeYears', takenAt: day(2023, 8, 15) }),
        memory({ id: 'lastYear', takenAt: day(2025, 8, 15) }),
        memory({ id: 'today', takenAt: now }),
        memory({ id: 'otherDay', takenAt: day(2023, 8, 16) }),
      ],
      now,
    ).map(m => m.id);

    expect(found).toEqual(['lastYear', 'threeYears']);
  });
});

describe('yearStats and reelSelection', () => {
  const data = {
    ...emptyData(),
    memories: [
      memory({ id: 'p1', takenAt: day(2026, 1, 2), favorite: true }),
      memory({ id: 'p2', takenAt: day(2026, 6, 10), location: 'Bali' }),
      memory({ id: 'v1', takenAt: day(2026, 6, 11), kind: 'video' }),
      memory({ id: 'old', takenAt: day(2025, 4, 4) }),
      memory({ id: 'secret', takenAt: day(2026, 7, 1), hidden: true }),
    ],
  };

  it('counts only the requested year, and skips hidden memories', () => {
    const stats = yearStats(data, 2026, day(2026, 12, 31));

    expect(stats.photos).toBe(2);
    expect(stats.videos).toBe(1);
    expect(stats.places).toEqual(['Bali']);
    expect(stats.memories.map(m => m.id)).not.toContain('secret');
    expect(stats.memories.map(m => m.id)).not.toContain('old');
  });

  it('groups the year into moments', () => {
    // Jan 2 stands alone; Jun 10-11 cluster together.
    expect(yearStats(data, 2026, day(2026, 12, 31)).moments).toBe(2);
  });

  it('leads the reel with favorites and returns it in chronological order', () => {
    const reel = reelSelection(yearStats(data, 2026, day(2026, 12, 31)));

    expect(reel.map(m => m.id)).toEqual(['p1', 'p2', 'v1']);
    for (let i = 1; i < reel.length; i++) {
      expect(reel[i].takenAt).toBeGreaterThanOrEqual(reel[i - 1].takenAt);
    }
  });

  it('caps the reel length', () => {
    const many = {
      ...emptyData(),
      memories: Array.from({ length: 120 }, (_, i) =>
        memory({ id: `m${i}`, takenAt: day(2026, 1, 1) + i * 10 * DAY_MS }),
      ),
    };

    expect(reelSelection(yearStats(many, 2026, day(2026, 12, 31)), 20)).toHaveLength(20);
  });
});
