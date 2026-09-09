import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import {
  Field,
  Header,
  Icon,
  PrimaryButton,
  Screen,
  Toggle,
  TileButton,
} from '../components/ui';
import { DateField } from '../components/DateField';
import { MediaThumb } from '../components/media';
import { useApp, type MemoryInput } from '../context/AppContext';
import { autoSyncRecent, captureNew, pickFromLibrary } from '../lib/importer';
import type { Memory } from '../types';
import type { RootProps } from '../navigation/types';

type Source = 'gallery' | 'camera' | 'video' | 'sync';

export function ImportScreen({ navigation, route }: RootProps<'Import'>) {
  const { addMemories, updateSettings, data, progress } = useApp();
  const presetAlbumId = route.params?.albumId;

  const [staged, setStaged] = useState<MemoryInput[]>([]);
  const [busy, setBusy] = useState<Source | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [dateOverride, setDateOverride] = useState<number | undefined>();
  const [favorite, setFavorite] = useState(false);

  const counts = useMemo(() => {
    const photos = staged.filter(i => i.kind === 'photo').length;
    return { photos, videos: staged.length - photos };
  }, [staged]);

  const stage = useCallback((incoming: MemoryInput[]) => {
    if (!incoming.length) return;
    setStaged(prev => {
      const seen = new Set(prev.map(i => i.sourceId ?? i.uri));
      return [...prev, ...incoming.filter(i => !seen.has(i.sourceId ?? i.uri))];
    });
  }, []);

  const run = async (source: Source) => {
    setBusy(source);
    try {
      if (source === 'gallery') {
        const picked = await pickFromLibrary();
        if (!picked.length) return;
        stage(picked);
      } else if (source === 'camera' || source === 'video') {
        const shot = await captureNew(source === 'video' ? 'video' : 'photo');
        stage(shot);
      } else {
        const found = await autoSyncRecent(data.settings.lastAutoSyncAt ?? 0);
        // Skip anything already in Us, so a repeat sync only ever offers new files.
        const known = new Set(data.memories.map(m => m.sourceId).filter(Boolean));
        const fresh = found.filter(i => !i.sourceId || !known.has(i.sourceId));
        if (!fresh.length) {
          Alert.alert('Nothing new', 'Everything on this device is already part of your story.');
          return;
        }
        stage(fresh);
        Alert.alert(
          'Auto Sync',
          `Found ${fresh.length} new item${fresh.length === 1 ? '' : 's'} on this device. Review and import below.`,
        );
      }
    } catch (err) {
      Alert.alert('Could not open', String(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = (key: string) =>
    setStaged(prev => prev.filter(i => (i.sourceId ?? i.uri) !== key));

  const doImport = async () => {
    if (!staged.length) return;
    const prepared = staged.map(item => ({
      ...item,
      caption: caption.trim() || item.caption,
      location: location.trim() || item.location,
      takenAt: dateOverride ?? item.takenAt,
      favorite,
      albumIds: presetAlbumId ? [presetAlbumId] : [],
    }));

    const created = await addMemories(prepared);
    // Move the Auto Sync watermark forward past everything we just took in.
    const newest = prepared.reduce((max, i) => Math.max(max, i.takenAt ?? 0), 0);
    if (newest > (data.settings.lastAutoSyncAt ?? 0)) {
      updateSettings({ lastAutoSyncAt: newest });
    }

    setStaged([]);
    setCaption('');
    setLocation('');
    setDateOverride(undefined);
    setFavorite(false);

    Alert.alert(
      'Added to your story',
      `${created.length} memor${created.length === 1 ? 'y is' : 'ies are'} now part of Us.`,
      [{ text: 'Lovely', onPress: () => navigation.goBack() }],
    );
  };

  const importing = progress.active;

  return (
    <Screen>
      <Header
        title="Import Memories"
        subtitle="Add your photos and videos"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={s.grid}>
            <TileButton
              icon="images-outline"
              title="From Gallery"
              subtitle="Select from your phone"
              onPress={() => run('gallery')}
            />
            <TileButton
              icon="camera-outline"
              title="From Camera"
              subtitle="Take a new photo"
              onPress={() => run('camera')}
            />
          </View>
          <View style={s.grid}>
            <TileButton
              icon="videocam-outline"
              title="Record Video"
              subtitle="Capture the moment"
              onPress={() => run('video')}
            />
            <TileButton
              icon="sync-outline"
              title="Auto Sync"
              subtitle="Sync from your device"
              onPress={() => run('sync')}
            />
          </View>

          {busy ? (
            <View style={s.busy}>
              <ActivityIndicator color={colors.pink} />
              <Text style={s.busyText}>
                {busy === 'sync' ? 'Scanning your camera roll…' : 'Opening…'}
              </Text>
            </View>
          ) : null}

          {staged.length ? (
            <>
              <View style={s.stagedHead}>
                <Text style={s.stagedTitle}>
                  {staged.length} selected
                  <Text style={s.stagedMeta}>
                    {'   '}
                    {counts.photos} photo{counts.photos === 1 ? '' : 's'} • {counts.videos} video
                    {counts.videos === 1 ? '' : 's'}
                  </Text>
                </Text>
                <Pressable onPress={() => setStaged([])} hitSlop={8} accessibilityRole="button">
                  <Text style={s.clear}>Clear</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.strip}>
                {staged.map(item => {
                  const key = item.sourceId ?? item.uri;
                  return (
                    <View key={key} style={s.stripItem}>
                      <MediaThumb
                        memory={
                          {
                            id: key,
                            uri: item.uri,
                            kind: item.kind,
                            durationMs: item.durationMs,
                            takenAt: item.takenAt ?? Date.now(),
                            addedAt: Date.now(),
                            addedBy: '',
                            favorite: false,
                            hidden: false,
                            albumIds: [],
                          } satisfies Memory
                        }
                        style={s.stripThumb}
                      />
                      <Pressable
                        onPress={() => remove(key)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Remove from selection"
                        style={s.stripRemove}>
                        <Icon name="close" size={13} color={colors.white} />
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          <Text style={s.sectionLabel}>QUICK OPTIONS</Text>
          <Text style={s.sectionHint}>
            Applied to everything you import in this batch. Leave blank to keep each file's own
            details.
          </Text>

          <Field
            label="ADD A CAPTION"
            value={caption}
            onChangeText={setCaption}
            placeholder="The day everything felt more beautiful with you."
            multiline
            maxLength={280}
          />
          <Field
            label="ADD LOCATION"
            value={location}
            onChangeText={setLocation}
            placeholder="Palawan, Philippines"
            maxLength={80}
            autoCapitalize="words"
          />
          <DateField
            label="CHOOSE A DATE"
            value={dateOverride}
            onChange={setDateOverride}
            placeholder="Keep the original date"
            maximumDate={new Date()}
          />

          <View style={s.favRow}>
            <Icon name="star-outline" size={19} color={colors.pink} />
            <Text style={s.favLabel}>Mark as favorite</Text>
            <Toggle value={favorite} onChange={setFavorite} />
          </View>
        </ScrollView>

        <View style={s.footer}>
          {importing ? (
            <View style={s.progress}>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    { width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={s.progressText}>
                Saving {progress.done} of {progress.total}…
              </Text>
            </View>
          ) : (
            <PrimaryButton
              label={staged.length ? `Import ${staged.length}` : 'Import'}
              icon="heart"
              onPress={doImport}
              disabled={!staged.length}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  grid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },

  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  busyText: { ...type.small, color: colors.textMuted, marginLeft: spacing.md },

  stagedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  stagedTitle: { ...type.title, color: colors.text },
  stagedMeta: { ...type.caption, color: colors.textMuted, fontWeight: '400' },
  clear: { ...type.small, color: colors.pink, fontWeight: '600' },

  strip: { paddingBottom: spacing.sm },
  stripItem: { marginRight: spacing.sm },
  stripThumb: { width: 82, height: 82 },
  stripRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    ...type.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.xl,
  },
  sectionHint: {
    ...type.small,
    color: colors.textFaint,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },

  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  favLabel: { ...type.body, color: colors.text, flex: 1, marginLeft: spacing.md },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  progress: { paddingVertical: spacing.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.pink },
  progressText: {
    ...type.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
