/**
 * One provider holds the whole shared space. Every mutation goes through here
 * so a single serialized write keeps the on-device store consistent.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Album,
  AppData,
  Countdown,
  Couple,
  LoveNote,
  MediaKind,
  Memory,
  Settings,
  StoryEvent,
} from '../types';
import { clearData, loadData, saveData } from '../storage/db';
import { emptyData } from '../storage/defaults';
import { deleteMedia, persistMedia } from '../storage/media';
import { digest, inviteCode as makeInviteCode, randomSalt, uid } from '../lib/id';
import { colors } from '../theme';

export interface MemoryInput {
  uri: string;
  kind: MediaKind;
  width?: number;
  height?: number;
  durationMs?: number;
  fileSize?: number;
  fileName?: string;
  takenAt?: number;
  caption?: string;
  location?: string;
  favorite?: boolean;
  albumIds?: string[];
  /** Device asset id — used to skip files Auto Sync already brought in. */
  sourceId?: string;
}

export interface ImportProgress {
  active: boolean;
  done: number;
  total: number;
}

interface AppContextValue {
  data: AppData;
  ready: boolean;
  progress: ImportProgress;

  // Couple
  createCouple(input: { myName: string; partnerName?: string; togetherSince?: number }): Couple;
  joinCouple(input: { code: string; myName: string; partnerName?: string }): Couple;
  updateCouple(patch: Partial<Omit<Couple, 'id' | 'members'>>): void;
  updateMember(id: string, patch: Partial<Omit<Member, 'id'>>): void;
  regenerateInviteCode(): string;

  // Memories
  addMemories(inputs: MemoryInput[]): Promise<Memory[]>;
  updateMemory(id: string, patch: Partial<Memory>): void;
  updateMemories(ids: string[], patch: Partial<Memory>): void;
  deleteMemory(id: string): Promise<void>;
  toggleFavorite(id: string): void;
  toggleHidden(id: string): void;
  setMemoryAlbums(id: string, albumIds: string[]): void;
  addToAlbum(memoryIds: string[], albumId: string): void;

  // Albums & moments
  createAlbum(title: string, icon?: string): Album;
  deleteAlbum(id: string): void;
  renameAlbum(id: string, title: string): void;
  setMomentTitle(momentId: string, title: string): void;

  // Love notes
  addNote(text: string): void;
  deleteNote(id: string): void;
  markNotesRead(): void;

  // Countdowns
  addCountdown(input: Omit<Countdown, 'id' | 'createdAt'>): void;
  updateCountdown(id: string, patch: Partial<Countdown>): void;
  deleteCountdown(id: string): void;

  // Our Story
  addStoryEvent(input: Omit<StoryEvent, 'id' | 'createdAt'>): void;
  updateStoryEvent(id: string, patch: Partial<StoryEvent>): void;
  deleteStoryEvent(id: string): void;

  // Settings & privacy
  updateSettings(patch: Partial<Settings>): void;
  setPasscode(code: string): void;
  verifyPasscode(code: string): boolean;
  clearPasscode(): void;
  resetEverything(): Promise<void>;
}

type Member = Couple['members'][number];

const AppContext = createContext<AppContextValue | null>(null);

const MEMBER_COLORS = [colors.pink, colors.gold];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData());
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    active: false,
    done: 0,
    total: 0,
  });

  // Keeps the newest snapshot available to async work without stale closures.
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    let cancelled = false;
    loadData().then(loaded => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Applies a change and persists it in one step. */
  const mutate = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      latest.current = next;
      saveData(next);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------- couple

  const createCouple = useCallback<AppContextValue['createCouple']>(
    ({ myName, partnerName, togetherSince }) => {
      const now = Date.now();
      const meId = uid('mem');
      const members: Member[] = [
        {
          id: meId,
          name: myName.trim() || 'Me',
          role: 'owner',
          joinedAt: now,
          color: MEMBER_COLORS[0],
        },
      ];
      if (partnerName?.trim()) {
        members.push({
          id: uid('mem'),
          name: partnerName.trim(),
          role: 'partner',
          joinedAt: now,
          color: MEMBER_COLORS[1],
        });
      }
      const couple: Couple = {
        id: uid('cpl'),
        title: 'Us',
        inviteCode: makeInviteCode(),
        togetherSince,
        createdAt: now,
        members,
      };
      mutate(prev => ({ ...prev, couple, meId, onboarded: true }));
      return couple;
    },
    [mutate],
  );

  const joinCouple = useCallback<AppContextValue['joinCouple']>(
    ({ code, myName, partnerName }) => {
      const now = Date.now();
      const meId = uid('mem');
      const members: Member[] = [
        {
          id: uid('mem'),
          name: partnerName?.trim() || 'My love',
          role: 'owner',
          joinedAt: now,
          color: MEMBER_COLORS[0],
        },
        {
          id: meId,
          name: myName.trim() || 'Me',
          role: 'partner',
          joinedAt: now,
          color: MEMBER_COLORS[1],
        },
      ];
      const couple: Couple = {
        id: uid('cpl'),
        title: 'Us',
        inviteCode: code,
        createdAt: now,
        members,
      };
      mutate(prev => ({ ...prev, couple, meId, onboarded: true }));
      return couple;
    },
    [mutate],
  );

  const updateCouple = useCallback<AppContextValue['updateCouple']>(
    patch => {
      mutate(prev =>
        prev.couple ? { ...prev, couple: { ...prev.couple, ...patch } } : prev,
      );
    },
    [mutate],
  );

  const updateMember = useCallback<AppContextValue['updateMember']>(
    (id, patch) => {
      mutate(prev =>
        prev.couple
          ? {
              ...prev,
              couple: {
                ...prev.couple,
                members: prev.couple.members.map(m => (m.id === id ? { ...m, ...patch } : m)),
              },
            }
          : prev,
      );
    },
    [mutate],
  );

  const regenerateInviteCode = useCallback<AppContextValue['regenerateInviteCode']>(() => {
    const code = makeInviteCode();
    updateCouple({ inviteCode: code });
    return code;
  }, [updateCouple]);

  // -------------------------------------------------------------- memories

  const addMemories = useCallback<AppContextValue['addMemories']>(
    async inputs => {
      if (!inputs.length) return [];

      const existingSources = new Set(
        latest.current.memories.map(m => m.sourceId).filter(Boolean) as string[],
      );
      const fresh = inputs.filter(i => !i.sourceId || !existingSources.has(i.sourceId));
      if (!fresh.length) return [];

      setProgress({ active: true, done: 0, total: fresh.length });
      const addedBy = latest.current.meId ?? latest.current.couple?.members[0]?.id ?? 'me';
      const created: Memory[] = [];

      for (let i = 0; i < fresh.length; i++) {
        const input = fresh[i];
        const id = uid('mem');
        const uri = await persistMedia(input.uri, input.kind, id, input.fileName);
        created.push({
          id,
          uri,
          kind: input.kind,
          width: input.width,
          height: input.height,
          durationMs: input.durationMs,
          fileSize: input.fileSize,
          caption: input.caption?.trim() || undefined,
          location: input.location?.trim() || undefined,
          takenAt: input.takenAt ?? Date.now(),
          addedAt: Date.now(),
          addedBy,
          favorite: input.favorite ?? false,
          hidden: false,
          albumIds: input.albumIds ?? [],
          sourceId: input.sourceId,
        });
        setProgress({ active: true, done: i + 1, total: fresh.length });
      }

      mutate(prev => ({ ...prev, memories: [...prev.memories, ...created] }));
      setProgress({ active: false, done: 0, total: 0 });
      return created;
    },
    [mutate],
  );

  const updateMemory = useCallback<AppContextValue['updateMemory']>(
    (id, patch) => {
      mutate(prev => ({
        ...prev,
        memories: prev.memories.map(m => (m.id === id ? { ...m, ...patch, id: m.id } : m)),
      }));
    },
    [mutate],
  );

  const updateMemories = useCallback<AppContextValue['updateMemories']>(
    (ids, patch) => {
      const set = new Set(ids);
      mutate(prev => ({
        ...prev,
        memories: prev.memories.map(m => (set.has(m.id) ? { ...m, ...patch, id: m.id } : m)),
      }));
    },
    [mutate],
  );

  const deleteMemory = useCallback<AppContextValue['deleteMemory']>(
    async id => {
      const target = latest.current.memories.find(m => m.id === id);
      mutate(prev => ({
        ...prev,
        memories: prev.memories.filter(m => m.id !== id),
        story: prev.story.map(e => ({
          ...e,
          memoryIds: e.memoryIds.filter(mid => mid !== id),
        })),
      }));
      if (target) await deleteMedia(target.uri);
    },
    [mutate],
  );

  const toggleFavorite = useCallback<AppContextValue['toggleFavorite']>(
    id => {
      mutate(prev => ({
        ...prev,
        memories: prev.memories.map(m => (m.id === id ? { ...m, favorite: !m.favorite } : m)),
      }));
    },
    [mutate],
  );

  const toggleHidden = useCallback<AppContextValue['toggleHidden']>(
    id => {
      mutate(prev => ({
        ...prev,
        memories: prev.memories.map(m => (m.id === id ? { ...m, hidden: !m.hidden } : m)),
      }));
    },
    [mutate],
  );

  const setMemoryAlbums = useCallback<AppContextValue['setMemoryAlbums']>(
    (id, albumIds) => updateMemory(id, { albumIds }),
    [updateMemory],
  );

  const addToAlbum = useCallback<AppContextValue['addToAlbum']>(
    (memoryIds, albumId) => {
      const set = new Set(memoryIds);
      mutate(prev => ({
        ...prev,
        memories: prev.memories.map(m =>
          set.has(m.id) && !m.albumIds.includes(albumId)
            ? { ...m, albumIds: [...m.albumIds, albumId] }
            : m,
        ),
      }));
    },
    [mutate],
  );

  // ---------------------------------------------------------------- albums

  const createAlbum = useCallback<AppContextValue['createAlbum']>(
    (title, icon = 'heart-outline') => {
      const album: Album = {
        id: uid('alb'),
        title: title.trim() || 'New Album',
        icon,
        rule: { type: 'manual' },
        system: false,
        createdAt: Date.now(),
        order: 100 + latest.current.albums.length,
      };
      mutate(prev => ({ ...prev, albums: [...prev.albums, album] }));
      return album;
    },
    [mutate],
  );

  const deleteAlbum = useCallback<AppContextValue['deleteAlbum']>(
    id => {
      mutate(prev => ({
        ...prev,
        albums: prev.albums.filter(a => a.id !== id || a.system),
        memories: prev.memories.map(m =>
          m.albumIds.includes(id) ? { ...m, albumIds: m.albumIds.filter(x => x !== id) } : m,
        ),
      }));
    },
    [mutate],
  );

  const renameAlbum = useCallback<AppContextValue['renameAlbum']>(
    (id, title) => {
      mutate(prev => ({
        ...prev,
        albums: prev.albums.map(a => (a.id === id ? { ...a, title } : a)),
      }));
    },
    [mutate],
  );

  const setMomentTitle = useCallback<AppContextValue['setMomentTitle']>(
    (momentId, title) => {
      mutate(prev => ({
        ...prev,
        momentTitles: { ...prev.momentTitles, [momentId]: title },
      }));
    },
    [mutate],
  );

  // ------------------------------------------------------------ love notes

  const addNote = useCallback<AppContextValue['addNote']>(
    text => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const note: LoveNote = {
        id: uid('note'),
        text: trimmed,
        authorId: latest.current.meId ?? 'me',
        createdAt: Date.now(),
      };
      mutate(prev => ({ ...prev, notes: [...prev.notes, note] }));
    },
    [mutate],
  );

  const deleteNote = useCallback<AppContextValue['deleteNote']>(
    id => mutate(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) })),
    [mutate],
  );

  const markNotesRead = useCallback<AppContextValue['markNotesRead']>(() => {
    const now = Date.now();
    mutate(prev => ({
      ...prev,
      notes: prev.notes.map(n =>
        n.readAt || n.authorId === prev.meId ? n : { ...n, readAt: now },
      ),
    }));
  }, [mutate]);

  // ------------------------------------------------------------ countdowns

  const addCountdown = useCallback<AppContextValue['addCountdown']>(
    input => {
      const countdown: Countdown = { ...input, id: uid('cd'), createdAt: Date.now() };
      mutate(prev => ({ ...prev, countdowns: [...prev.countdowns, countdown] }));
    },
    [mutate],
  );

  const updateCountdown = useCallback<AppContextValue['updateCountdown']>(
    (id, patch) => {
      mutate(prev => ({
        ...prev,
        countdowns: prev.countdowns.map(c => (c.id === id ? { ...c, ...patch, id } : c)),
      }));
    },
    [mutate],
  );

  const deleteCountdown = useCallback<AppContextValue['deleteCountdown']>(
    id => mutate(prev => ({ ...prev, countdowns: prev.countdowns.filter(c => c.id !== id) })),
    [mutate],
  );

  // -------------------------------------------------------------- our story

  const addStoryEvent = useCallback<AppContextValue['addStoryEvent']>(
    input => {
      const event: StoryEvent = { ...input, id: uid('evt'), createdAt: Date.now() };
      mutate(prev => ({ ...prev, story: [...prev.story, event] }));
    },
    [mutate],
  );

  const updateStoryEvent = useCallback<AppContextValue['updateStoryEvent']>(
    (id, patch) => {
      mutate(prev => ({
        ...prev,
        story: prev.story.map(e => (e.id === id ? { ...e, ...patch, id } : e)),
      }));
    },
    [mutate],
  );

  const deleteStoryEvent = useCallback<AppContextValue['deleteStoryEvent']>(
    id => mutate(prev => ({ ...prev, story: prev.story.filter(e => e.id !== id) })),
    [mutate],
  );

  // --------------------------------------------------------------- privacy

  const updateSettings = useCallback<AppContextValue['updateSettings']>(
    patch => mutate(prev => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    [mutate],
  );

  const setPasscode = useCallback<AppContextValue['setPasscode']>(
    code => {
      const salt = randomSalt();
      mutate(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          appLockEnabled: true,
          passcodeSalt: salt,
          passcodeHash: digest(code, salt),
        },
      }));
    },
    [mutate],
  );

  const verifyPasscode = useCallback<AppContextValue['verifyPasscode']>(code => {
    const { passcodeHash, passcodeSalt } = latest.current.settings;
    if (!passcodeHash || !passcodeSalt) return true;
    return digest(code, passcodeSalt) === passcodeHash;
  }, []);

  const clearPasscode = useCallback<AppContextValue['clearPasscode']>(() => {
    mutate(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        appLockEnabled: false,
        biometricsEnabled: false,
        passcodeHash: undefined,
        passcodeSalt: undefined,
      },
    }));
  }, [mutate]);

  const resetEverything = useCallback<AppContextValue['resetEverything']>(async () => {
    const all = latest.current.memories;
    await Promise.all(all.map(m => deleteMedia(m.uri)));
    await clearData();
    const blank = emptyData();
    latest.current = blank;
    setData(blank);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      ready,
      progress,
      createCouple,
      joinCouple,
      updateCouple,
      updateMember,
      regenerateInviteCode,
      addMemories,
      updateMemory,
      updateMemories,
      deleteMemory,
      toggleFavorite,
      toggleHidden,
      setMemoryAlbums,
      addToAlbum,
      createAlbum,
      deleteAlbum,
      renameAlbum,
      setMomentTitle,
      addNote,
      deleteNote,
      markNotesRead,
      addCountdown,
      updateCountdown,
      deleteCountdown,
      addStoryEvent,
      updateStoryEvent,
      deleteStoryEvent,
      updateSettings,
      setPasscode,
      verifyPasscode,
      clearPasscode,
      resetEverything,
    }),
    [
      data,
      ready,
      progress,
      createCouple,
      joinCouple,
      updateCouple,
      updateMember,
      regenerateInviteCode,
      addMemories,
      updateMemory,
      updateMemories,
      deleteMemory,
      toggleFavorite,
      toggleHidden,
      setMemoryAlbums,
      addToAlbum,
      createAlbum,
      deleteAlbum,
      renameAlbum,
      setMomentTitle,
      addNote,
      deleteNote,
      markNotesRead,
      addCountdown,
      updateCountdown,
      deleteCountdown,
      addStoryEvent,
      updateStoryEvent,
      deleteStoryEvent,
      updateSettings,
      setPasscode,
      verifyPasscode,
      clearPasscode,
      resetEverything,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** The member using this device, and their partner. */
export function useMe() {
  const { data } = useApp();
  const members = data.couple?.members ?? [];
  const me = members.find(m => m.id === data.meId) ?? members[0];
  const partner = members.find(m => m.id !== me?.id);
  return { me, partner, members };
}
