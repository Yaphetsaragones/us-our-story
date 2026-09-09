# Us — Our Story

A private space for two to collect, cherish, and relive your best moments.

Built with the **React Native CLI** (bare RN 0.87, new architecture on). Everything
lives on the device: the memory index in AsyncStorage, the media files in the app's
own private documents directory. There is no server, no account, no analytics and
no upload.

---

## Run it

```bash
npm install

# Android (device or emulator)
npm run android

# iOS (needs macOS)
cd ios && pod install && cd ..
npm run ios
```

If Metro is not already running, `npm start` in a second terminal.

### Build a release APK

```bash
cd android
./gradlew assembleRelease        # android/app/build/outputs/apk/release/
```

Before you ship, replace the debug signing config in `android/app/build.gradle`
with your own keystore.

---

## How the app works

### 1. Create your couple account
The first person sets a name, their partner's name and the day it all started.
The app generates a readable invite code (`L7QK-92MB`) and a matching
`usourstory://join/L7QK-92MB` deep link to share. The second person enters that
code and their phone becomes their side of the space.

> **The one honest gap:** the two phones don't sync yet. Memories stay on the
> device that added them. Everything else — the pairing flow, the two-member
> model, per-member attribution on notes and memories — is already in place, so
> adding a sync backend means writing a transport, not reshaping the app. See
> *Where sync plugs in* below.

### 2. Import your memories
`+ Add Memory` offers four ways in:

| Source | What it does |
| --- | --- |
| **From Gallery** | Multi-select — hundreds of photos and videos in one go |
| **From Camera** | Take a new photo straight into the space |
| **Record Video** | Capture a clip |
| **Auto Sync** | Sweeps the camera roll for anything newer than the last sweep |

Before importing you can apply a caption, a location, a date and a favorite flag
to the whole batch. Each file keeps its own original capture date unless you
override it. Auto Sync remembers what it already brought in (matched on the device
asset id), so re-running it never duplicates.

Files are copied into the app's private storage, so a memory survives you clearing
the phone's cache or deleting the original from the gallery.

### 3. The app organizes everything
Nothing is filed by hand. Two derived views are recomputed from the memories
themselves every time they change:

- **Moments** — memories cluster by date. A gap of more than two days starts a new
  one, so a weekend becomes one card and a two-week trip becomes one card with its
  own date range and place. The title comes from the most common location in the
  cluster, falling back to a caption, then the month.
- **Collections** — seven of them build themselves from rules: *Our First Date*
  (the whole earliest day), *Trips Together* (anything with a place), *Birthdays*
  (matched against each member's birthday), *Anniversaries* (matched against your
  together-since day), *Funny Videos*, *Random Happy Moments* (whatever is left
  untagged) and *Our Favorites*. You can add your own collections on top —
  *Sunset Moments*, *Late Night Drives*, anything — and file memories into them by
  hand.

### 4. Both partners can add memories
Every memory and note records who added it, and the Love Notes thread renders each
side differently. On one device this shows as attribution; once sync lands, it is
what makes the collection genuinely shared.

### 5. Relive old memories
**Memory of the Day** surfaces anything from this same calendar date in earlier
years — "3 years ago today" — grouped by year, and swipeable full-screen. The Home
hero image is whatever it found for today.

### 6. Make special albums
Covered above: seven automatic collections plus as many hand-made ones as you like.

### 7. Create your yearly movie
**Our Year** shows the year as a poster: photos, videos, moments, days together,
places, favorites — with a mosaic of the year behind it. **Watch Our Year** plays
the reel: a title card with the numbers, then the highlights cross-fading with a
slow Ken Burns drift, captions and places over each frame, videos playing inline,
and a closing card.

The highlight picker leads with your favorites, then takes a spread across the
year's moments so the reel isn't all one weekend.

> The reel plays in-app rather than encoding an MP4. Rendering a shareable video
> file needs a native encoder (FFmpeg or MediaCodec) that this app deliberately
> doesn't bundle — the playback is what a rendered movie would show.

### 8. Keep it private
- 4-digit app lock, with biometrics (Face ID / Touch ID / fingerprint) on top
- Re-locks whenever the app goes to the background, with a short grace period so
  returning from the photo picker doesn't demand a re-unlock
- Hide individual memories — kept, but out of every browse surface
- A one-tap wipe that removes every memory, note, countdown and milestone from
  the device

The passcode is stored as a salted digest, never in the clear. It is a local
convenience lock: it gates the UI, it does not encrypt the media files.

### ⭐ Our Story
The timeline tab is the whole relationship as one chronological scroll: milestones
you add — first message, first date, first trip, anniversaries, future plans — woven
in with the auto-grouped moments, and a "Today" marker showing how many days you're
in. Each milestone can link the memories that belong to it.

---

## Project layout

```
src/
  theme/           design tokens — palette, spacing, type scale, shadows
  types/           the domain model
  lib/
    date.ts        formatting and relationship math
    id.ts          ids, invite codes, passcode digest
    select.ts      ← the interesting part: clustering, album rules, year stats
    importer.ts    gallery / camera / auto-sync + runtime permissions
  storage/
    db.ts          AsyncStorage store with serialized writes and migration
    defaults.ts    the seven system collections
    media.ts       copying media into app-private storage
  context/
    AppContext.tsx one provider, every mutation
    LockContext.tsx app lock + background re-lock
  components/      ui kit, media tiles, date field, prompt modal
  navigation/      stack + tabs + the floating tab bar
  screens/         18 screens
__tests__/
  select.test.ts   19 tests over the organizing logic
```

`src/lib/select.ts` is where the app's intelligence lives, and it is pure — no
React, no native modules — which is why it is the part under test.

## Checks

```bash
npx tsc --noEmit     # types
npx eslint . --ext .ts,.tsx
npx jest             # 19 tests
```

---

## Where sync plugs in

The store is a single serialized JSON document behind `src/storage/db.ts`, and
every write already goes through one `mutate()` in `AppContext`. To make the space
truly shared:

1. Give `Couple.id` a real server record, keyed by the invite code.
2. Push each mutation as an event (they are already small and well-shaped).
3. Upload media out of `src/storage/media.ts` and store a remote URL alongside the
   local URI, falling back to the local file when offline.
4. Reconcile on `loadData()` — memories carry `addedAt` and `addedBy`, which is
   enough for last-write-wins per entity.

## Known simplifications

- **No cross-device sync** (above).
- **Video thumbnails** show a play badge rather than a frame grab. Pulling a poster
  frame needs a native thumbnailer; the badge keeps grids of hundreds of items
  scrolling smoothly. Videos play properly in the viewer and in the year movie.
- **The year movie plays in-app** rather than exporting a video file (above).
- **Location is typed, not detected.** There is no geocoding dependency; you tag a
  place and the app clusters and titles on it.
- **No backup.** A phone reset takes the memories with it. The Privacy screen says
  so plainly.
