/**
 * Our Story: milestones you write and moments the app groups for you, woven
 * into one chronological scroll from the first entry to what is still ahead.
 */
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, fonts, gradients, radius, spacing, type } from '../theme';
import { EmptyState, Icon, Screen, TabSpacer } from '../components/ui';
import { ActionSheet, type SheetAction } from '../components/ActionSheet';
import { MediaThumb } from '../components/media';
import { useApp } from '../context/AppContext';
import { buildMoments, visibleMemories } from '../lib/select';
import { daysBetween, format, fmtDate } from '../lib/date';
import type { Memory, Moment, StoryEvent, StoryKind } from '../types';
import type { TabProps } from '../navigation/types';

const KIND_ICON: Record<StoryKind, string> = {
  'first-message': 'chatbubble-ellipses-outline',
  'first-date': 'heart-outline',
  'first-trip': 'airplane-outline',
  anniversary: 'infinite-outline',
  milestone: 'ribbon-outline',
  future: 'telescope-outline',
};

type Entry =
  | { kind: 'event'; at: number; event: StoryEvent }
  | { kind: 'moment'; at: number; moment: Moment };

export function TimelineScreen({ navigation }: TabProps<'Timeline'>) {
  const { data, deleteStoryEvent } = useApp();
  const [menuFor, setMenuFor] = useState<Entry | null>(null);

  const memories = useMemo(() => visibleMemories(data), [data]);
  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );

  /** Oldest first — a story reads forwards. */
  const entries = useMemo<Entry[]>(
    () =>
      [
        ...data.story.map<Entry>(event => ({ kind: 'event', at: event.date, event })),
        ...moments.map<Entry>(moment => ({ kind: 'moment', at: moment.startAt, moment })),
      ].sort((a, b) => a.at - b.at),
    [data.story, moments],
  );

  const daysTogether = data.couple?.togetherSince ? daysBetween(data.couple.togetherSince) : null;
  const hero = useMemo(
    () => memories.find(m => m.favorite && m.kind === 'photo') ?? memories.find(m => m.kind === 'photo'),
    [memories],
  );

  const actionsFor = (entry: Entry): SheetAction[] => {
    if (entry.kind === 'event') {
      const { event } = entry;
      return [
        {
          label: 'Remove this milestone',
          icon: 'trash-outline',
          destructive: true,
          onPress: () => deleteStoryEvent(event.id),
        },
        {
          label: 'Edit this milestone',
          icon: 'create-outline',
          onPress: () => navigation.navigate('StoryEventEdit', { id: event.id }),
        },
        ...(event.memoryIds.length
          ? [
              {
                label: 'View its memories',
                icon: 'images-outline',
                onPress: () =>
                  navigation.navigate('Viewer', {
                    ids: event.memoryIds,
                    index: 0,
                    title: event.title,
                  }),
              },
            ]
          : []),
      ];
    }

    const { moment } = entry;
    return [
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
        label: 'Mark as a milestone',
        icon: 'ribbon-outline',
        onPress: () => navigation.navigate('StoryEventEdit', {}),
      },
    ];
  };

  return (
    <Screen>
      {/* -------------------------------------------------------------- header */}
      <View style={s.header}>
        <View style={s.headerBody}>
          <Text style={s.title}>Our Story</Text>
          <View style={s.subtitleRow}>
            <Text style={s.subtitle}>Every chapter of us, in one place</Text>
            <Icon name="heart" size={11} color={colors.pink} style={s.subtitleHeart} />
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('StoryEventEdit', {})}
          accessibilityRole="button"
          accessibilityLabel="Add a milestone"
          style={({ pressed }) => [s.addBtn, pressed && s.pressed]}>
          <Icon name="add" size={14} color={colors.white} />
          <Text style={s.addBtnText}>Add Memory</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ---------------------------------------------------------- hero */}
        {hero ? (
          <View style={s.hero}>
            <Image source={{ uri: hero.uri }} style={absFill} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(20,10,16,0.85)', 'rgba(20,10,16,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={absFill}
            />
            <View style={s.heroBody}>
              <View style={s.heroTitleRow}>
                <Text style={s.heroTitle}>Our{'\n'}Story</Text>
                <Icon name="heart-outline" size={14} color={colors.white} style={s.heroHeart} />
              </View>
              <Text style={s.heroLine}>Same people.{'\n'}Brighter days.</Text>
            </View>

            {data.couple?.togetherSince ? (
              <View style={s.heroMeta}>
                <Text style={s.heroMetaLabel}>Together since</Text>
                <Text style={s.heroMetaValue}>{fmtDate(data.couple.togetherSince)}</Text>
                {daysTogether !== null ? (
                  <>
                    <Text style={s.heroDays}>{daysTogether}</Text>
                    <Text style={s.heroMetaLabel}>Days Together</Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ------------------------------------------------------- timeline */}
        {entries.length ? (
          <View style={s.rail}>
            {entries.map((entry, i) => (
              <View key={keyOf(entry, i)} style={s.entry}>
                <View style={s.gutter}>
                  <Text style={s.gutterDate}>
                    {format(new Date(entry.at), 'MMM d').toUpperCase()}
                    {'\n'}
                    {format(new Date(entry.at), 'yyyy')}
                  </Text>
                </View>

                <View style={s.spine}>
                  <View style={[s.dot, entry.kind === 'event' && s.dotEvent]} />
                  <View style={s.line} />
                </View>

                <View style={s.cardWrap}>
                  {entry.kind === 'event' ? (
                    <EventCard
                      event={entry.event}
                      memories={data.memories.filter(m => entry.event.memoryIds.includes(m.id))}
                      onPress={() => navigation.navigate('StoryEventEdit', { id: entry.event.id })}
                      onMenu={() => setMenuFor(entry)}
                    />
                  ) : (
                    <MomentCard
                      moment={entry.moment}
                      onPress={() =>
                        navigation.navigate('Collection', {
                          source: 'moment',
                          id: entry.moment.id,
                          title: entry.moment.title,
                        })
                      }
                      onMenu={() => setMenuFor(entry)}
                    />
                  )}
                </View>
              </View>
            ))}

            {/* ------------------------------------------------ what's next */}
            <View style={s.entry}>
              <View style={s.gutter}>
                <Text style={s.gutterToday}>TODAY</Text>
                <Text style={s.gutterDate}>
                  {format(new Date(), 'MMM d').toUpperCase()}
                  {'\n'}
                  {format(new Date(), 'yyyy')}
                </Text>
              </View>
              <View style={s.spine}>
                <View style={[s.dot, s.dotToday]} />
              </View>
              <View style={s.cardWrap}>
                <Pressable
                  onPress={() => navigation.navigate('Import')}
                  accessibilityRole="button"
                  style={({ pressed }) => [pressed && s.pressed]}>
                  <LinearGradient
                    colors={[...gradients.brand]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.nextCard}>
                    <View style={s.nextIcon}>
                      <Icon name="create-outline" size={18} color={colors.white} />
                    </View>
                    <View style={s.nextBody}>
                      <Text style={s.nextTitle}>What's next?</Text>
                      <Text style={s.nextLine}>
                        Add a new memory and keep our story going…
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={17} color={colors.white} />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            <Text style={s.footer}>
              A collection of the little moments{'\n'}that mean everything ♥
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="git-commit-outline"
            title="Where does your story start?"
            message="Add the first message, the first date, the first trip — then let your memories fill in everything between."
            actionLabel="Add a milestone"
            onAction={() => navigation.navigate('StoryEventEdit', {})}
          />
        )}

        <TabSpacer />
      </ScrollView>

      <ActionSheet
        visible={!!menuFor}
        title={
          menuFor?.kind === 'event' ? menuFor.event.title : menuFor?.moment.title ?? undefined
        }
        message={menuFor ? fmtDate(menuFor.at) : undefined}
        actions={menuFor ? actionsFor(menuFor) : []}
        onClose={() => setMenuFor(null)}
      />
    </Screen>
  );
}

function keyOf(entry: Entry, i: number): string {
  return entry.kind === 'event' ? entry.event.id : `${entry.moment.id}-${i}`;
}

/** Up to four covers across the top, then title, caption and a count badge. */
function CardShell({
  covers,
  title,
  caption,
  count,
  icon,
  onPress,
  onMenu,
}: {
  covers: Memory[];
  title: string;
  caption?: string;
  count: number;
  icon?: string;
  onPress: () => void;
  onMenu: () => void;
}) {
  return (
    <View style={s.card}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
        {covers.length ? (
          <View style={s.cardCovers}>
            {covers.map(m => (
              <View key={m.id} style={s.cardCover}>
                <MediaThumb memory={m} style={absFill} radius={0} showBadges={false} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[s.cardCovers, s.cardCoversEmpty]}>
            <Icon name={icon ?? 'sparkles-outline'} size={22} color={colors.textFaint} />
          </View>
        )}

        <View style={s.cardBody}>
          <View style={s.cardText}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            {caption ? (
              <Text style={s.cardCaption} numberOfLines={1}>
                {caption}
              </Text>
            ) : null}
          </View>

          {count > 0 ? (
            <View style={s.countBadge}>
              <Icon name="images-outline" size={11} color={colors.textMuted} />
              <Text style={s.countText}>{count}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onMenu}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${title}`}
        style={s.cardMenu}>
        <Icon name="ellipsis-vertical" size={15} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function EventCard({
  event,
  memories,
  onPress,
  onMenu,
}: {
  event: StoryEvent;
  memories: Memory[];
  onPress: () => void;
  onMenu: () => void;
}) {
  return (
    <CardShell
      covers={memories.filter(m => m.kind === 'photo').slice(0, 4)}
      title={event.title}
      caption={event.note}
      count={event.memoryIds.length}
      icon={KIND_ICON[event.kind]}
      onPress={onPress}
      onMenu={onMenu}
    />
  );
}

function MomentCard({
  moment,
  onPress,
  onMenu,
}: {
  moment: Moment;
  onPress: () => void;
  onMenu: () => void;
}) {
  const caption =
    moment.location ??
    moment.memories.find(m => m.caption)?.caption ??
    `${moment.photoCount} photo${moment.photoCount === 1 ? '' : 's'}`;

  return (
    <CardShell
      covers={moment.memories.filter(m => m.kind === 'photo').slice(0, 4)}
      title={moment.title}
      caption={caption}
      count={moment.memories.length}
      onPress={onPress}
      onMenu={onMenu}
    />
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.85 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBody: { flex: 1 },
  title: { ...type.h2, color: colors.text },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  subtitle: { ...type.caption, color: colors.textMuted },
  subtitleHeart: { marginLeft: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkDeep,
  },
  addBtnText: { ...type.caption, color: colors.white, fontWeight: '700' },

  // hero
  hero: {
    height: 132,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroBody: { paddingHorizontal: spacing.lg },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  heroTitle: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 27,
    lineHeight: 30,
    color: colors.white,
  },
  heroHeart: { marginLeft: 5, marginTop: 3 },
  heroLine: { ...type.caption, color: 'rgba(255,255,255,0.8)', marginTop: 6, lineHeight: 15 },
  heroMeta: { position: 'absolute', right: spacing.lg, top: spacing.md, alignItems: 'flex-end' },
  heroMetaLabel: { ...type.caption, fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  heroMetaValue: { ...type.caption, color: colors.white, marginBottom: spacing.sm },
  heroDays: { fontSize: 30, lineHeight: 34, fontWeight: '700', color: colors.pink },

  // rail
  rail: {},
  entry: { flexDirection: 'row' },
  gutter: { width: 46, alignItems: 'flex-end', paddingTop: 2 },
  gutterToday: { ...type.caption, fontSize: 9, color: colors.pink, fontWeight: '700' },
  gutterDate: {
    ...type.caption,
    fontSize: 9,
    lineHeight: 12,
    color: colors.textFaint,
    textAlign: 'right',
  },
  spine: { width: 22, alignItems: 'center', paddingTop: 4 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.pinkDeep,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  dotEvent: { backgroundColor: colors.pink, width: 11, height: 11, borderRadius: 6 },
  dotToday: { backgroundColor: colors.gold, width: 11, height: 11, borderRadius: 6 },
  line: { width: 1.5, flex: 1, backgroundColor: colors.borderSoft, marginTop: 2 },
  cardWrap: { flex: 1, paddingBottom: spacing.lg },

  // card
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardCovers: { flexDirection: 'row', height: 88, gap: 1.5 },
  cardCoversEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  cardCover: { flex: 1, overflow: 'hidden' },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardText: { flex: 1, paddingRight: spacing.lg },
  cardTitle: { ...type.body, fontWeight: '700', color: colors.text },
  cardCaption: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.lg,
  },
  countText: { ...type.caption, color: colors.textMuted },
  cardMenu: { position: 'absolute', right: 0, bottom: 12, padding: spacing.sm },

  // what's next
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  nextIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBody: { flex: 1 },
  nextTitle: { ...type.body, fontWeight: '700', color: colors.white },
  nextLine: { ...type.caption, color: 'rgba(255,255,255,0.9)', marginTop: 1 },

  footer: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
