import React, { useMemo } from 'react';
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
import { absFill, colors, gradients, radius, shadow, spacing, type } from '../theme';
import {
  EmptyState,
  Icon,
  IconButton,
  ScriptTitle,
  SectionTitle,
  Screen,
  TabSpacer,
} from '../components/ui';
import { MomentCard } from '../components/media';
import { useApp, useMe } from '../context/AppContext';
import { buildMoments, memoriesOnThisDay, visibleMemories } from '../lib/select';
import { daysBetween, daysUntil, fmtAgo, fmtDate, nextOccurrence } from '../lib/date';
import type { TabProps } from '../navigation/types';

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export function HomeScreen({ navigation }: TabProps<'Home'>) {
  const { data } = useApp();
  const { me, partner } = useMe();
  const { width } = useWindowDimensions();

  const memories = useMemo(() => visibleMemories(data), [data]);
  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );
  const onThisDay = useMemo(() => memoriesOnThisDay(memories), [memories]);
  const featured = onThisDay[0];

  const cardWidth = (width - spacing.xl * 2 - spacing.md * 2) / 2.35;

  const daysTogether = data.couple?.togetherSince
    ? daysBetween(data.couple.togetherSince)
    : null;

  const nextCountdown = useMemo(() => {
    const items = data.countdowns.map(c => ({
      ...c,
      due: c.repeatsYearly ? nextOccurrence(c.date) : c.date,
    }));
    return items
      .filter(c => daysUntil(c.due) >= 0)
      .sort((a, b) => a.due - b.due)[0];
  }, [data.countdowns]);

  const unreadNotes = data.notes.filter(n => !n.readAt && n.authorId !== data.meId).length;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.hero}>
          {featured ? (
            <Image source={{ uri: featured.uri }} style={absFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[...gradients.sunset]} style={absFill} />
          )}
          <LinearGradient colors={[...gradients.scrimDown]} style={s.heroScrim} />

          <View style={s.heroTop}>
            <View style={s.heroTitleWrap}>
              <ScriptTitle text="Us" size={36} />
              <Icon name="heart" size={13} color={colors.white} style={s.heroHeart} />
            </View>
            <IconButton
              name="settings-outline"
              onPress={() => navigation.navigate('Profile')}
              label="Settings"
            />
          </View>

          <View style={s.heroBody}>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.greetingNames}>
              {[me?.name, partner?.name].filter(Boolean).join(' & ') || 'forever & always'}
            </Text>
            {daysTogether !== null ? (
              <View style={s.daysPill}>
                <Icon name="heart" size={11} color={colors.white} />
                <Text style={s.daysText}>{daysTogether.toLocaleString()} days together</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Memory of the day */}
        <View style={s.section}>
          <Pressable
            onPress={() => navigation.navigate('MemoryOfTheDay')}
            accessibilityRole="button"
            style={({ pressed }) => [s.todayCard, pressed && s.pressed]}>
            {featured ? (
              <Image source={{ uri: featured.uri }} style={s.todayThumb} resizeMode="cover" />
            ) : (
              <View style={[s.todayThumb, s.todayThumbEmpty]}>
                <Icon name="time-outline" size={22} color={colors.pink} />
              </View>
            )}
            <View style={s.todayBody}>
              <Text style={s.todayLabel}>Today's Memory</Text>
              {featured ? (
                <>
                  <Text style={s.todayDate}>{fmtDate(featured.takenAt)}</Text>
                  <Text style={s.todayCaption} numberOfLines={2}>
                    {featured.caption
                      ? `"${featured.caption}"`
                      : `${fmtAgo(featured.takenAt)} — and it still makes you smile.`}
                  </Text>
                </>
              ) : (
                <Text style={s.todayCaption} numberOfLines={2}>
                  Nothing from this day yet. Add memories and they will find you again next year.
                </Text>
              )}
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        </View>

        {/* Quick links */}
        <View style={s.quickRow}>
          <QuickLink
            icon="mail-outline"
            label="Love Notes"
            badge={unreadNotes}
            onPress={() => navigation.navigate('LoveNotes')}
          />
          <QuickLink
            icon="hourglass-outline"
            label={nextCountdown ? `${daysUntil(nextCountdown.due)}d` : 'Countdowns'}
            sublabel={nextCountdown?.title}
            onPress={() => navigation.navigate('Countdowns')}
          />
          <QuickLink
            icon="film-outline"
            label="Our Year"
            onPress={() => navigation.navigate('OurYear')}
          />
        </View>

        {/* Recent moments */}
        <View style={s.section}>
          <SectionTitle
            title="Recent Memories"
            actionLabel={moments.length ? 'See all' : undefined}
            onAction={() => navigation.navigate('Collection', { source: 'all', title: 'All Memories' })}
          />

          {moments.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.momentsRow}>
              {moments.slice(0, 8).map(moment => (
                <MomentCard
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
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="images-outline"
              title="Your story starts here"
              message="Add your first photos and videos — the app builds the timeline, the collections and the year movie around them."
              actionLabel="Add memories"
              onAction={() => navigation.navigate('Import')}
            />
          )}
        </View>

        <TabSpacer />
      </ScrollView>
    </Screen>
  );
}

function QuickLink({
  icon,
  label,
  sublabel,
  badge,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      style={({ pressed }) => [s.quick, pressed && s.pressed]}>
      <View style={s.quickIcon}>
        <Icon name={icon} size={19} color={colors.pink} />
        {badge ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.quickLabel} numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={s.quickSub} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  pressed: { opacity: 0.75 },

  hero: {
    height: 260,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    paddingTop: spacing.md,
  },
  heroTitleWrap: { flexDirection: 'row', alignItems: 'flex-start' },
  heroHeart: { marginTop: 14, marginLeft: 4 },
  heroBody: { padding: spacing.xl },
  greeting: { ...type.h2, color: colors.white, fontWeight: '300' },
  greetingNames: { ...type.h2, color: colors.white, fontWeight: '300' },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  daysText: { ...type.caption, color: colors.white, marginLeft: 5 },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },

  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  todayThumb: {
    width: 66,
    height: 66,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  todayThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  todayBody: { flex: 1, paddingRight: spacing.sm },
  todayLabel: { ...type.title, color: colors.text },
  todayDate: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  todayCaption: {
    ...type.small,
    color: colors.textSoft,
    fontStyle: 'italic',
    marginTop: 5,
    lineHeight: 18,
  },

  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  quick: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  quickIcon: { marginBottom: spacing.sm },
  quickLabel: { ...type.small, color: colors.text, fontWeight: '600' },
  quickSub: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.white },

  momentsRow: { paddingRight: spacing.lg },
});
