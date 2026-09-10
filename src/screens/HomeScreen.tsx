import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, fonts, gradients, radius, shadow, spacing, type } from '../theme';
import { EmptyState, Icon, Screen, SectionTitle, TabSpacer } from '../components/ui';
import { ActionSheet, type SheetAction } from '../components/ActionSheet';
import { MediaThumb } from '../components/media';
import { useApp, useMe } from '../context/AppContext';
import { albumMemories, buildMoments, memoriesOnThisDay, visibleMemories } from '../lib/select';
import { daysBetween, fmtDate, fmtRange } from '../lib/date';
import type { Memory, Moment } from '../types';
import type { TabProps } from '../navigation/types';

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

const QUICK_LINKS = [
  { key: 'photos', icon: 'images-outline', label: 'Photos' },
  { key: 'notes', icon: 'heart-outline', label: 'Love Notes' },
  { key: 'countdowns', icon: 'calendar-outline', label: 'Countdowns' },
  { key: 'story', icon: 'book-outline', label: 'Our Story' },
] as const;

const SPECIAL = [
  {
    key: 'sys_birthdays',
    icon: 'gift-outline',
    title: 'Birthdays',
    caption: 'Remember\nspecial days',
  },
  {
    key: 'sys_anniversaries',
    icon: 'heart-outline',
    title: 'Anniversaries',
    caption: 'Celebrate\nour journey',
  },
  {
    key: 'sys_trips',
    icon: 'location-outline',
    title: 'Places',
    caption: "Where we've\nbeen together",
  },
] as const;

export function HomeScreen({ navigation }: TabProps<'Home'>) {
  const { data } = useApp();
  const { me, partner } = useMe();
  const { width } = useWindowDimensions();
  const [menuFor, setMenuFor] = useState<Moment | null>(null);

  const memories = useMemo(() => visibleMemories(data), [data]);
  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );
  const onThisDay = useMemo(() => memoriesOnThisDay(memories), [memories]);

  /** The hero leads with a memory from this day in an earlier year, else the first one you ever added. */
  const hero = onThisDay[0] ?? memories[memories.length - 1];
  const heroMoment = useMemo(
    () => (hero ? moments.find(m => m.memories.some(x => x.id === hero.id)) : undefined),
    [hero, moments],
  );

  const daysTogether = data.couple?.togetherSince ? daysBetween(data.couple.togetherSince) : null;
  const unreadNotes = data.notes.filter(n => !n.readAt && n.authorId !== data.meId).length;

  const cardWidth = Math.min(150, (width - spacing.lg * 2 - spacing.md) / 2.4);
  const initials = [me?.name?.[0], partner?.name?.[0]].filter(Boolean).join('').toUpperCase();

  const openQuick = (key: (typeof QUICK_LINKS)[number]['key']) => {
    if (key === 'photos') {
      navigation.navigate('Collection', { source: 'all', title: 'All Memories' });
    } else if (key === 'notes') {
      navigation.navigate('LoveNotes');
    } else if (key === 'countdowns') {
      navigation.navigate('Countdowns');
    } else {
      navigation.navigate('Timeline');
    }
  };

  const momentActions = (moment: Moment): SheetAction[] => [
    {
      label: 'Open this moment',
      icon: 'images-outline',
      onPress: () =>
        navigation.navigate('Collection', {
          source: 'moment',
          id: moment.id,
          title: moment.title,
        }),
    },
    {
      label: 'Play as slideshow',
      icon: 'play-outline',
      onPress: () =>
        navigation.navigate('Viewer', {
          ids: moment.memories.map(m => m.id),
          index: 0,
          title: moment.title,
        }),
    },
    {
      label: 'Add to this moment',
      icon: 'add-outline',
      onPress: () => navigation.navigate('Import'),
    },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ---------------------------------------------------------- top bar */}
        <View style={s.topBar}>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={s.avatar}>
            {me?.avatarUri ? (
              <Image source={{ uri: me.avatarUri }} style={s.avatarImg} />
            ) : (
              <LinearGradient colors={[...gradients.brand]} style={s.avatarImg}>
                <Text style={s.avatarText}>{initials || '♥'}</Text>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            style={s.topBarBody}>
            <Text style={s.greeting}>{greeting()}</Text>
            <View style={s.nameRow}>
              <Text style={s.names} numberOfLines={1}>
                {[me?.name, partner?.name].filter(Boolean).join(' & ').toUpperCase() || 'US'}
              </Text>
              <Icon name="heart" size={12} color={colors.pink} style={s.nameHeart} />
            </View>
            {data.couple?.togetherSince ? (
              <Text style={s.since}>
                Together since {fmtDate(data.couple.togetherSince)}
                {daysTogether !== null ? ` · ${daysTogether} days` : ''}
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search memories"
            style={s.topIcon}>
            <Icon name="search-outline" size={21} color={colors.textSoft} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('LoveNotes')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotes ? `${unreadNotes} unread love notes` : 'Love notes'
            }
            style={s.topIcon}>
            <Icon name="notifications-outline" size={21} color={colors.textSoft} />
            {unreadNotes ? <View style={s.dot} /> : null}
          </Pressable>
        </View>

        {/* ------------------------------------------------------------- hero */}
        {hero ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Viewer', {
                ids: (heroMoment?.memories ?? [hero]).map(m => m.id),
                index: 0,
                title: heroMoment?.title ?? 'Our Memory',
              })
            }
            accessibilityRole="button"
            style={({ pressed }) => [s.hero, pressed && s.pressed]}>
            <Image source={{ uri: hero.uri }} style={absFill} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(20,10,16,0.55)', 'rgba(20,10,16,0.15)', 'rgba(20,10,16,0.85)']}
              style={absFill}
            />

            <Text style={s.heroScriptSmall}>
              Same People{'\n'}Brighter Days
            </Text>

            <View style={s.heroBody}>
              <Text style={s.heroTitle} numberOfLines={2}>
                {heroMoment?.title ?? 'Our Memory'}
              </Text>
              <Text style={s.heroLine}>
                {hero.caption ?? 'Every moment with you is a special memory.'}
              </Text>

              <View style={s.heroFooter}>
                <View style={s.heroBtn}>
                  <Text style={s.heroBtnText}>View Memory</Text>
                  <Icon name="chevron-forward" size={14} color={colors.white} />
                </View>
                <View style={s.heroMeta}>
                  <Text style={s.heroDate}>{fmtDate(hero.takenAt)}</Text>
                  {daysTogether !== null ? (
                    <View style={s.heroDaysRow}>
                      <Icon name="heart" size={11} color={colors.pinkSoft} />
                      <Text style={s.heroDays}>{daysTogether} days together</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

          </Pressable>
        ) : null}

        {/* ---------------------------------------------------- quick actions */}
        <View style={s.quickRow}>
          {QUICK_LINKS.map(link => (
            <Pressable
              key={link.key}
              onPress={() => openQuick(link.key)}
              accessibilityRole="button"
              style={({ pressed }) => [s.quick, pressed && s.quickPressed]}>
              <Icon name={link.icon} size={20} color={colors.pink} />
              <Text style={s.quickLabel}>{link.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ---------------------------------------------------- today's memory */}
        <Pressable
          onPress={() =>
            onThisDay.length ? navigation.navigate('MemoryOfTheDay') : navigation.navigate('Import')
          }
          accessibilityRole="button"
          style={({ pressed }) => [s.today, pressed && s.pressed]}>
          <View style={s.todayIcon}>
            <Icon name="calendar-outline" size={20} color={colors.pink} />
          </View>
          <View style={s.todayBody}>
            <Text style={s.todayTitle}>Today's Memory</Text>
            <Text style={s.todayText}>
              {onThisDay.length
                ? `${onThisDay.length} memor${onThisDay.length === 1 ? 'y' : 'ies'} from this day in earlier years.`
                : 'Nothing from this day yet. Add memories and they will find you again in the future.'}
            </Text>
            <View style={s.addBtn}>
              <Icon name="add" size={14} color={colors.white} />
              <Text style={s.addBtnText} numberOfLines={1}>
                Add Memory
              </Text>
            </View>
          </View>
        </Pressable>

        {/* --------------------------------------------------- recent memories */}
        <View style={s.section}>
          <SectionTitle
            title="Recent Memories"
            actionLabel={moments.length ? 'See All' : undefined}
            onAction={() =>
              navigation.navigate('Collection', { source: 'all', title: 'All Memories' })
            }
          />

          {moments.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.momentsRow}>
              {moments.slice(0, 10).map(moment => (
                <MomentTile
                  key={moment.id}
                  moment={moment}
                  width={cardWidth}
                  onPress={() =>
                    navigation.navigate('Collection', {
                      source: 'moment',
                      id: moment.id,
                      title: moment.title,
                    })
                  }
                  onMenu={() => setMenuFor(moment)}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="images-outline"
              title="Your story starts here"
              message="Add your first photos and videos — the timeline, the collections and the year movie all build themselves around them."
              actionLabel="Add memories"
              onAction={() => navigation.navigate('Import')}
            />
          )}
        </View>

        {/* --------------------------------------------------- special moments */}
        {memories.length ? (
          <View style={s.section}>
            <SectionTitle
              title="Special Moments"
              actionLabel="See All"
              onAction={() => navigation.navigate('Moments')}
            />
            <View style={s.specialRow}>
              {SPECIAL.map(item => {
                const album = data.albums.find(a => a.id === item.key);
                const count = album ? albumMemories(album, memories, data.couple).length : 0;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      navigation.navigate('Collection', {
                        source: 'album',
                        id: item.key,
                        title: item.title,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, ${count} memories`}
                    style={({ pressed }) => [s.special, pressed && s.quickPressed]}>
                    <View style={s.specialIcon}>
                      <Icon name={item.icon} size={17} color={colors.pink} />
                    </View>
                    <Text style={s.specialTitle}>{item.title}</Text>
                    <Text style={s.specialCaption}>{item.caption}</Text>
                    <Icon
                      name="chevron-forward"
                      size={13}
                      color={colors.textFaint}
                      style={s.specialChevron}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <TabSpacer />
      </ScrollView>

      <ActionSheet
        visible={!!menuFor}
        title={menuFor?.title}
        message={menuFor ? fmtRange(menuFor.startAt, menuFor.endAt) : undefined}
        actions={menuFor ? momentActions(menuFor) : []}
        onClose={() => setMenuFor(null)}
      />
    </Screen>
  );
}

/** A card in Recent Memories: cover, title, date, count and an overflow menu. */
function MomentTile({
  moment,
  width,
  onPress,
  onMenu,
}: {
  moment: Moment;
  width: number;
  onPress: () => void;
  onMenu: () => void;
}) {
  const cover: Memory | undefined =
    moment.memories.find(m => m.kind === 'photo') ?? moment.memories[0];

  return (
    <View style={[s.tile, { width }]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={moment.title}>
        <View style={s.tileCover}>
          {cover ? (
            <MediaThumb memory={cover} style={absFill} radius={radius.lg} showBadges={false} />
          ) : null}
        </View>
        <Text style={s.tileTitle} numberOfLines={1}>
          {moment.title}
        </Text>
        <Text style={s.tileMeta} numberOfLines={1}>
          {fmtDate(moment.startAt)}
        </Text>
        <Text style={s.tileMeta} numberOfLines={1}>
          {moment.photoCount ? `${moment.photoCount} photos` : ''}
          {moment.photoCount && moment.videoCount ? ' · ' : ''}
          {moment.videoCount ? `${moment.videoCount} videos` : ''}
        </Text>
      </Pressable>

      <Pressable
        onPress={onMenu}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${moment.title}`}
        style={s.tileMenu}>
        <Icon name="ellipsis-vertical" size={15} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  pressed: { opacity: 0.85 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },

  // top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  avatar: { marginRight: spacing.md },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.small, color: colors.white, fontWeight: '700' },
  topBarBody: { flex: 1 },
  greeting: { ...type.small, color: colors.textMuted },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  names: { ...type.title, color: colors.text, letterSpacing: 0.4 },
  nameHeart: { marginLeft: 5 },
  since: { ...type.caption, color: colors.textFaint, marginTop: 1 },
  topIcon: { padding: 6, marginLeft: 2 },
  dot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },

  // hero
  hero: {
    height: 250,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    ...shadow.card,
  },
  heroScriptSmall: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },
  heroBody: { padding: spacing.lg },
  heroTitle: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 34,
    lineHeight: 42,
    color: colors.white,
  },
  heroLine: {
    ...type.small,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  heroFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    gap: 4,
  },
  heroBtnText: { ...type.small, color: colors.white, fontWeight: '600' },
  heroMeta: { alignItems: 'flex-end' },
  heroDate: { ...type.caption, color: colors.white },
  heroDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroDays: { ...type.caption, color: 'rgba(255,255,255,0.75)' },

  // quick actions
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  quick: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  quickPressed: { backgroundColor: colors.surfacePressed },
  quickLabel: { ...type.caption, color: colors.textSoft, fontWeight: '600' },

  // today's memory
  today: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  todayIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBody: { flex: 1, minWidth: 0 },
  todayTitle: { ...type.body, fontWeight: '700', color: colors.text },
  todayText: { ...type.caption, color: colors.textMuted, marginTop: 3, lineHeight: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkDeep,
    gap: 4,
  },
  addBtnText: { ...type.caption, color: colors.white, fontWeight: '700' },

  // recent memories
  momentsRow: { paddingRight: spacing.lg, gap: spacing.md },
  tile: {},
  tileCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  tileTitle: { ...type.small, fontWeight: '700', color: colors.text },
  tileMeta: { ...type.caption, color: colors.textMuted, marginTop: 1 },
  tileMenu: { position: 'absolute', right: -4, bottom: 6, padding: 6 },

  // special moments
  specialRow: { flexDirection: 'row', gap: spacing.sm },
  special: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 116,
  },
  specialIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  specialTitle: { ...type.small, fontWeight: '700', color: colors.text },
  specialCaption: { ...type.caption, color: colors.textMuted, marginTop: 2, lineHeight: 14 },
  specialChevron: { position: 'absolute', right: spacing.sm, bottom: spacing.sm },
});
