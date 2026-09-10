import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, fonts, radius, spacing, type } from '../theme';
import { EmptyState, Icon, Screen, TabSpacer } from '../components/ui';
import { PromptModal } from '../components/PromptModal';
import { ActionSheet, type SheetAction } from '../components/ActionSheet';
import { MediaThumb } from '../components/media';
import { useApp } from '../context/AppContext';
import { albumMemories, buildMoments, visibleMemories } from '../lib/select';
import { fmtRange } from '../lib/date';
import type { Album, Memory } from '../types';
import type { TabProps } from '../navigation/types';

type Filter = 'all' | 'photo' | 'video';

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'photo', label: 'Photos', icon: 'image-outline' },
  { key: 'video', label: 'Videos', icon: 'play-circle-outline' },
];

export function MomentsScreen({ navigation }: TabProps<'Moments'>) {
  const { data, createAlbum, updateSettings } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [naming, setNaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showByDate, setShowByDate] = useState(false);

  const memories = useMemo(() => {
    const all = visibleMemories(data);
    return filter === 'all' ? all : all.filter(m => m.kind === filter);
  }, [data, filter]);

  const collections = useMemo(
    () =>
      [...data.albums]
        .sort((a, b) => a.order - b.order)
        .map(album => ({ album, items: albumMemories(album, memories, data.couple) })),
    [data.albums, memories, data.couple],
  );

  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );

  /** The banner sits on a favourite when there is one, else the newest memory. */
  const banner = useMemo(
    () => memories.find(m => m.favorite && m.kind === 'photo') ?? memories.find(m => m.kind === 'photo'),
    [memories],
  );

  const addAlbum = (title: string) => {
    const album = createAlbum(title);
    setNaming(false);
    navigation.navigate('Collection', { source: 'album', id: album.id, title: album.title });
  };

  const menuActions: SheetAction[] = [
    {
      label: 'Create a collection',
      icon: 'add-circle-outline',
      onPress: () => setNaming(true),
    },
    {
      label: showByDate ? 'Hide grouping by date' : 'Group by date',
      icon: 'calendar-outline',
      onPress: () => setShowByDate(v => !v),
    },
    {
      label: data.settings.showHiddenMemories ? 'Hide hidden memories' : 'Show hidden memories',
      icon: data.settings.showHiddenMemories ? 'eye-off-outline' : 'eye-outline',
      onPress: () =>
        updateSettings({ showHiddenMemories: !data.settings.showHiddenMemories }),
    },
  ];

  const hasAnything = data.memories.length > 0;

  return (
    <Screen>
      {/* ------------------------------------------------------------- header */}
      <View style={s.header}>
        <View style={s.headerBody}>
          <View style={s.titleRow}>
            <Text style={s.title}>Our Moments</Text>
            <Icon name="heart-outline" size={17} color={colors.pink} style={s.titleHeart} />
          </View>
          <Text style={s.subtitle}>Small moments. Big memories.</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Search')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Search memories"
          style={s.headerIcon}>
          <Icon name="search-outline" size={21} color={colors.textSoft} />
        </Pressable>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={s.headerIcon}>
          <Icon name="ellipsis-vertical" size={19} color={colors.textSoft} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ------------------------------------------------------------ filters */}
        <View style={s.filters}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[s.chip, active && s.chipActive]}>
                <Icon
                  name={f.icon}
                  size={14}
                  color={active ? colors.white : colors.textMuted}
                />
                <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {!hasAnything ? (
          <EmptyState
            icon="albums-outline"
            title="Collections build themselves"
            message="Import a few memories and your first date, your trips, your birthdays and your favorites all get gathered up automatically."
            actionLabel="Add memories"
            onAction={() => navigation.navigate('Import')}
          />
        ) : (
          <>
            {/* ----------------------------------------------------- banner */}
            {banner ? (
              <Pressable
                onPress={() => navigation.navigate('Collection', { source: 'favorites' })}
                accessibilityRole="button"
                accessibilityLabel="Our favorite memories"
                style={({ pressed }) => [s.banner, pressed && s.pressed]}>
                <Image source={{ uri: banner.uri }} style={absFill} resizeMode="cover" />
                <LinearGradient
                  colors={['rgba(20,10,16,0.82)', 'rgba(20,10,16,0.25)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={absFill}
                />
                <Text style={s.bannerKicker}>
                  SAME{'\n'}PEOPLE{'\n'}BRIGHTER{'\n'}DAYS
                </Text>
                <View style={s.bannerBody}>
                  <Text style={s.bannerTitle}>
                    Together{'\n'}Through{'\n'}Every Moment
                  </Text>
                  <Text style={s.bannerLine}>A collection of our favorite memories.</Text>
                </View>
              </Pressable>
            ) : null}

            {/* ------------------------------------------------ collections */}
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Collections</Text>
              <Pressable
                onPress={() => setNaming(true)}
                hitSlop={8}
                accessibilityRole="button"
                style={s.createBtn}>
                <Icon name="add-circle-outline" size={15} color={colors.pink} />
                <Text style={s.createText}>Create Collection</Text>
              </Pressable>
            </View>

            {collections.map(({ album, items }) => (
              <CollectionCard
                key={album.id}
                album={album}
                items={items}
                onPress={() =>
                  navigation.navigate('Collection', {
                    source: 'album',
                    id: album.id,
                    title: album.title,
                  })
                }
              />
            ))}

            {/* --------------------------------------------------- by date */}
            {showByDate ? (
              <>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>By date</Text>
                  <Text style={s.sectionHint}>{moments.length} moments</Text>
                </View>
                {moments.map(moment => (
                  <Pressable
                    key={moment.id}
                    onPress={() =>
                      navigation.navigate('Collection', {
                        source: 'moment',
                        id: moment.id,
                        title: moment.title,
                      })
                    }
                    accessibilityRole="button"
                    style={({ pressed }) => [s.dateRow, pressed && s.rowPressed]}>
                    <View style={s.dateThumb}>
                      {moment.memories[0] ? (
                        <MediaThumb
                          memory={moment.memories[0]}
                          style={absFill}
                          radius={radius.md}
                          showBadges={false}
                        />
                      ) : null}
                    </View>
                    <View style={s.dateBody}>
                      <Text style={s.rowTitle} numberOfLines={1}>
                        {moment.title}
                      </Text>
                      <Text style={s.rowCount}>{fmtRange(moment.startAt, moment.endAt)}</Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color={colors.textFaint} />
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}

        <TabSpacer />
      </ScrollView>

      <PromptModal
        visible={naming}
        title="New collection"
        message="Sunset Moments, Late Night Drives, Our Silly Faces — anything you want to keep together."
        placeholder="Collection name"
        confirmLabel="Create"
        onCancel={() => setNaming(false)}
        onSubmit={addAlbum}
      />

      <ActionSheet
        visible={menuOpen}
        title="Our Moments"
        actions={menuActions}
        onClose={() => setMenuOpen(false)}
      />
    </Screen>
  );
}

/**
 * A collection row: cover on the left, a coloured icon badge, the title with
 * its count and tagline, and the collection's own photos ghosted in behind.
 */
function CollectionCard({
  album,
  items,
  onPress,
}: {
  album: Album;
  items: Memory[];
  onPress: () => void;
}) {
  const cover: Memory | undefined = items.find(m => m.kind === 'photo') ?? items[0];
  const backdrop = items.filter(m => m.kind === 'photo').slice(1, 4);
  const accent = album.accent ?? colors.pink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${album.title}, ${items.length} items`}
      style={({ pressed }) => [s.card, pressed && s.rowPressed]}>
      {/* Ghosted photos from inside the collection, as texture rather than content. */}
      <View style={s.cardBackdrop} pointerEvents="none">
        {backdrop.map(m => (
          <Image key={m.id} source={{ uri: m.uri }} style={s.backdropImg} resizeMode="cover" />
        ))}
        <LinearGradient
          colors={['rgba(28,23,27,1)', 'rgba(28,23,27,0.55)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={absFill}
        />
      </View>

      <View style={s.cardCover}>
        {cover ? (
          <MediaThumb memory={cover} style={absFill} radius={radius.md} showBadges={false} />
        ) : (
          <View style={[absFill, s.cardCoverEmpty]}>
            <Icon name={album.icon} size={18} color={colors.textFaint} />
          </View>
        )}
      </View>

      <View style={[s.cardBadge, { backgroundColor: `${accent}2E`, borderColor: `${accent}66` }]}>
        <Icon name={album.icon} size={15} color={accent} />
      </View>

      <View style={s.cardBody}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={s.rowCount}>
          {items.length} item{items.length === 1 ? '' : 's'}
        </Text>
        {album.caption ? (
          <Text style={s.rowCaption} numberOfLines={1}>
            {album.caption}
          </Text>
        ) : null}
      </View>

      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  pressed: { opacity: 0.88 },
  rowPressed: { opacity: 0.7 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...type.h2, color: colors.text },
  titleHeart: { marginLeft: 6 },
  subtitle: { ...type.caption, color: colors.textMuted, marginTop: 1 },
  headerIcon: { padding: 6, marginLeft: 2 },

  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.pinkDeep },
  chipText: { ...type.small, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.white },

  banner: {
    height: 118,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  bannerBody: { paddingHorizontal: spacing.lg },
  bannerTitle: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 25,
    color: colors.white,
  },
  bannerLine: { ...type.caption, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  bannerKicker: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    ...type.caption,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { ...type.title, color: colors.text },
  sectionHint: { ...type.caption, color: colors.textFaint },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  createText: { ...type.small, color: colors.pink, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  cardBackdrop: { ...absFill, flexDirection: 'row', justifyContent: 'flex-end' },
  backdropImg: { width: '26%', height: '100%' },
  cardCover: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  cardCoverEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 2 },
  rowTitle: { ...type.body, fontWeight: '700', color: colors.text },
  rowCount: { ...type.caption, color: colors.textMuted, marginTop: 1 },
  rowCaption: { ...type.caption, color: colors.textFaint, marginTop: 1 },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dateThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  dateBody: { flex: 1 },
});
