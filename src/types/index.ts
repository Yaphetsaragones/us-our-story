/** Core domain model for the shared couple space. */

export type MediaKind = 'photo' | 'video';

export type MemberRole = 'owner' | 'partner';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  /** Optional avatar, stored the same way memories are. */
  avatarUri?: string;
  birthday?: number;
  joinedAt: number;
  color: string;
}

export interface Couple {
  id: string;
  /** What the two of you call this space. Defaults to "Us". */
  title: string;
  inviteCode: string;
  /** Day one — drives "Days Together" and the anniversary countdown. */
  togetherSince?: number;
  createdAt: number;
  members: Member[];
}

export interface Memory {
  id: string;
  uri: string;
  kind: MediaKind;
  width?: number;
  height?: number;
  /** Videos only, in milliseconds. */
  durationMs?: number;
  fileSize?: number;
  caption?: string;
  location?: string;
  /** When the moment happened — this is what the timeline sorts on. */
  takenAt: number;
  /** When it landed in the app. */
  addedAt: number;
  addedBy: string;
  favorite: boolean;
  /** Hidden memories stay out of every browse surface until revealed. */
  hidden: boolean;
  albumIds: string[];
  /** Original device asset id, so Auto Sync never imports the same file twice. */
  sourceId?: string;
}

export type AlbumRule =
  | { type: 'manual' }
  | { type: 'favorites' }
  | { type: 'hasLocation' }
  | { type: 'firstDay' }
  | { type: 'videos' }
  | { type: 'dateMatch'; month: number; day: number }
  /** Resolved against the couple's "together since" day. */
  | { type: 'anniversary' }
  /** Resolved against every member's birthday. */
  | { type: 'birthdays' }
  | { type: 'uncategorized' };

export interface Album {
  id: string;
  title: string;
  icon: string;
  /** One line under the title, e.g. "Where it all began". */
  caption?: string;
  /** Colour of the icon badge, so collections are told apart at a glance. */
  accent?: string;
  rule: AlbumRule;
  /** Auto albums are generated on first launch and cannot be deleted. */
  system: boolean;
  coverMemoryId?: string;
  createdAt: number;
  order: number;
}

export interface LoveNote {
  id: string;
  text: string;
  authorId: string;
  createdAt: number;
  readAt?: number;
}

export interface Countdown {
  id: string;
  title: string;
  /** Target date. Yearly ones roll forward automatically once they pass. */
  date: number;
  icon: string;
  repeatsYearly: boolean;
  createdAt: number;
}

export type StoryKind =
  | 'first-message'
  | 'first-date'
  | 'first-trip'
  | 'anniversary'
  | 'milestone'
  | 'future';

export interface StoryEvent {
  id: string;
  title: string;
  note?: string;
  date: number;
  kind: StoryKind;
  memoryIds: string[];
  createdAt: number;
}

export interface Settings {
  appLockEnabled: boolean;
  biometricsEnabled: boolean;
  /** Salted digest — the passcode itself is never stored. */
  passcodeHash?: string;
  passcodeSalt?: string;
  showHiddenMemories: boolean;
  memoryOfTheDayEnabled: boolean;
  /** Newest device asset already pulled in by Auto Sync. */
  lastAutoSyncAt?: number;
  slideshowSeconds: number;
}

/** A date-clustered group of memories — the app's automatic "moment". */
export interface Moment {
  id: string;
  title: string;
  startAt: number;
  endAt: number;
  location?: string;
  memories: Memory[];
  photoCount: number;
  videoCount: number;
}

export interface AppData {
  version: number;
  couple: Couple | null;
  memories: Memory[];
  albums: Album[];
  notes: LoveNote[];
  countdowns: Countdown[];
  story: StoryEvent[];
  settings: Settings;
  /** Per-cluster title overrides, keyed by moment id. */
  momentTitles: Record<string, string>;
  /** Which member is using this device. */
  meId: string | null;
  onboarded: boolean;
}
