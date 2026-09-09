/**
 * Our Story: milestones and auto-grouped moments woven into one chronological
 * scroll, from the first message all the way to what is still ahead.
 */
import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme';
import {
  EmptyState,
  Header,
  Icon,
  IconButton,
  Screen,
  ScriptTitle,
  TabSpacer,
} from '../components/ui';
import { useApp } from '../context/AppContext';
import { buildMoments, visibleMemories } from '../lib/select';
import { daysBetween, daysUntil, fmtDate, fmtRange } from '../lib/date';
import type { Moment, StoryEvent, StoryKind } from '../types';
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
  | { type: 'event'; at: number; event: StoryEvent }
  | { type: 'moment'; at: number; moment: Moment }
  | { type: 'now'; at: number };

export function TimelineScreen({ navigation }: TabProps<'Timeline'>) {
  const { data } = useApp();
  const memories = useMemo(() => visibleMemories(data), [data]);
  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );

  const entries = useMemo<Entry[]>(() => {
    const now = Date.now();
    const list: Entry[] = [
      ...data.story.map<Entry>(event => ({ type: 'event', at: event.date, event })),
      ...moments.map<Entry>(moment => ({ type: 'moment', at: moment.startAt, moment })),
      { type: 'now', at: now },
    ];
    return list.sort((a, b) => a.at - b.at);
  }, [data.story, moments]);

  const daysTogether = data.couple?.togetherSince
    ? daysBetween(data.couple.togetherSince)
    : null;

  const hasContent = data.story.length > 0 || moments.length > 0;

  return (
    <Screen>
      <Header
        title="Our Story"
        center={false}
        subtitle={
          daysTogether !== null
            ? `${daysTogether.toLocaleString()} days and counting`
            : undefined
        }
        right={
          <IconButton
            name="add"
            onPress={() => navigation.navigate('StoryEventEdit', {})}
            label="Add a milestone"
          />
        }
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {!hasContent ? (
          <EmptyState
            icon="git-commit-outline"
            title="Where does your story start?"
            message="Add the first message, the first date, the first trip — then let the memories fill in everything between."
            actionLabel="Add a milestone"
            onAction={() => navigation.navigate('StoryEventEdit', {})}
          />
        ) : (
          <>
            <View style={s.intro}>
              <ScriptTitle text="Our Story" size={34} />
              <Text style={s.introLine}>
                Every first, every trip, every ordinary day worth keeping.
              </Text>
            </View>

            <View style={s.rail}>
              {entries.map((entry, i) => (
                <View key={keyOf(entry, i)} style={s.entry}>
                  <View style={s.gutter}>
                    <View
                      style={[
                        s.dot,
                        entry.type === 'event' && s.dotEvent,
                        entry.type === 'now' && s.dotNow,
                      ]}
                    />
                    {i < entries.length - 1 ? <View style={s.line} /> : null}
                  </View>

                  <View style={s.card}>
                    {entry.type === 'now' ? (
                      <NowCard daysTogether={daysTogether} />
                    ) : entry.type === 'event' ? (
                      <EventCard
                        event={entry.event}
                        onPress={() =>
                          navigation.navigate('StoryEventEdit', { id: entry.event.id })
                        }
                        onOpenMemories={
                          entry.event.memoryIds.length
                            ? () =>
                                navigation.navigate('Viewer', {
                                  ids: entry.event.memoryIds,
                                  index: 0,
                                  title: entry.event.title,
                                })
                            : undefined
                        }
                      />
                    ) : (
                      <MomentEntry
                        moment={entry.moment}
                        onPress={() =>
                          navigation.navigate('Collection', {
                            source: 'moment',
                            id: entry.moment.id,
                            title: entry.moment.title,
                          })
                        }
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <TabSpacer />
      </ScrollView>
    </Screen>
  );
}

function keyOf(entry: Entry, i: number): string {
  if (entry.type === 'event') return entry.event.id;
  if (entry.type === 'moment') return entry.moment.id;
  return `now-${i}`;
}

function NowCard({ daysTogether }: { daysTogether: number | null }) {
  return (
    <LinearGradient colors={[...gradients.brand]} style={s.nowCard}>
      <Icon name="heart" size={18} color={colors.white} />
      <Text style={s.nowTitle}>Today</Text>
      <Text style={s.nowText}>
        {daysTogether !== null
          ? `${daysTogether.toLocaleString()} days in, and the story keeps going.`
          : 'The story keeps going.'}
      </Text>
    </LinearGradient>
  );
}

function EventCard({
  event,
  onPress,
  onOpenMemories,
}: {
  event: StoryEvent;
  onPress: () => void;
  onOpenMemories?: () => void;
}) {
  const future = event.date > Date.now();
  const away = daysUntil(event.date);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.eventCard, pressed && s.pressed]}>
      <View style={s.eventHead}>
        <View style={s.eventIcon}>
          <Icon name={KIND_ICON[event.kind]} size={16} color={colors.pink} />
        </View>
        <View style={s.eventHeadBody}>
          <Text style={s.eventTitle}>{event.title}</Text>
          <Text style={s.eventDate}>
            {fmtDate(event.date)}
            {future ? ` • in ${away} day${away === 1 ? '' : 's'}` : ''}
          </Text>
        </View>
      </View>

      {event.note ? <Text style={s.eventNote}>{event.note}</Text> : null}

      {onOpenMemories ? (
        <Pressable onPress={onOpenMemories} accessibilityRole="button" style={s.eventLink}>
          <Icon name="images-outline" size={13} color={colors.pink} />
          <Text style={s.eventLinkText}>
            {event.memoryIds.length} memor{event.memoryIds.length === 1 ? 'y' : 'ies'}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function MomentEntry({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const covers = moment.memories.filter(m => m.kind === 'photo').slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.momentEntry, pressed && s.pressed]}>
      {covers.length ? (
        <View style={s.covers}>
          {covers.map(m => (
            <Image key={m.id} source={{ uri: m.uri }} style={s.cover} resizeMode="cover" />
          ))}
        </View>
      ) : null}
      <Text style={s.momentTitle} numberOfLines={1}>
        {moment.title}
      </Text>
      <Text style={s.momentMeta}>
        {fmtRange(moment.startAt, moment.endAt)} • {moment.photoCount} photo
        {moment.photoCount === 1 ? '' : 's'}
        {moment.videoCount ? ` • ${moment.videoCount} video${moment.videoCount === 1 ? '' : 's'}` : ''}
      </Text>
      {moment.location ? (
        <View style={s.momentPlace}>
          <Icon name="location-outline" size={11} color={colors.pink} />
          <Text style={s.momentPlaceText}>{moment.location}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.82 },

  intro: { alignItems: 'center', paddingVertical: spacing.lg },
  introLine: {
    ...type.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  rail: { marginTop: spacing.md },
  entry: { flexDirection: 'row' },
  gutter: { width: 28, alignItems: 'center' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  dotEvent: { backgroundColor: colors.pink, width: 11, height: 11, borderRadius: 6 },
  dotNow: { backgroundColor: colors.gold, width: 11, height: 11, borderRadius: 6 },
  line: { width: 1.5, flex: 1, backgroundColor: colors.borderSoft, marginVertical: 4 },
  card: { flex: 1, paddingBottom: spacing.lg },

  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.pinkDeep,
    padding: spacing.lg,
  },
  eventHead: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  eventHeadBody: { flex: 1 },
  eventTitle: { ...type.body, fontWeight: '600', color: colors.text },
  eventDate: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  eventNote: {
    ...type.small,
    color: colors.textSoft,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: spacing.md,
  },
  eventLink: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  eventLinkText: { ...type.caption, color: colors.pink, marginLeft: 5 },

  momentEntry: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  covers: { flexDirection: 'row', gap: 3, marginBottom: spacing.md },
  cover: { flex: 1, height: 78, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  momentTitle: { ...type.body, fontWeight: '600', color: colors.text },
  momentMeta: { ...type.caption, color: colors.textMuted, marginTop: 3 },
  momentPlace: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  momentPlaceText: { ...type.caption, color: colors.pink, marginLeft: 4 },

  nowCard: { borderRadius: radius.lg, padding: spacing.lg },
  nowTitle: { ...type.title, color: colors.white, marginTop: spacing.sm },
  nowText: { ...type.small, color: 'rgba(255,255,255,0.9)', marginTop: 3, lineHeight: 19 },
});
