import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, gradients, radius, shadow, spacing, type } from '../theme';
import { EmptyState, Header, Icon, PrimaryButton, Screen } from '../components/ui';
import { MediaThumb } from '../components/media';
import { useApp } from '../context/AppContext';
import { memoriesOnThisDay, visibleMemories } from '../lib/select';
import { fmtAgo, fmtDate } from '../lib/date';
import type { RootProps } from '../navigation/types';

export function MemoryOfTheDayScreen({ navigation }: RootProps<'MemoryOfTheDay'>) {
  const { data } = useApp();

  const memories = useMemo(() => visibleMemories(data), [data]);
  const onThisDay = useMemo(() => memoriesOnThisDay(memories), [memories]);
  const hero = onThisDay[0];

  // Group the rest by the year they happened.
  const byYear = useMemo(() => {
    const map = new Map<number, typeof onThisDay>();
    onThisDay.forEach(m => {
      const y = new Date(m.takenAt).getFullYear();
      map.set(y, [...(map.get(y) ?? []), m]);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [onThisDay]);

  const openAll = () =>
    navigation.navigate('Viewer', {
      ids: onThisDay.map(m => m.id),
      index: 0,
      title: 'On This Day',
    });

  return (
    <Screen>
      <Header title="Memory of the Day" onBack={() => navigation.goBack()} />

      {hero ? (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={openAll} accessibilityRole="button" style={s.heroCard}>
            {hero.kind === 'photo' ? (
              <Image source={{ uri: hero.uri }} style={absFill} resizeMode="cover" />
            ) : (
              <MediaThumb memory={hero} style={absFill} radius={radius.xl} showBadges={false} />
            )}
            <LinearGradient colors={[...gradients.scrimDown]} style={s.heroScrim} />
            <View style={s.heroText}>
              <Text style={s.ago}>{fmtAgo(hero.takenAt)}…</Text>
              <Text style={s.heroDate}>{fmtDate(hero.takenAt)}</Text>
            </View>
          </Pressable>

          <View style={s.captionCard}>
            <Text style={s.caption}>
              {hero.caption
                ? `"${hero.caption}"`
                : 'Same place, same smiles, just more love now.'}
            </Text>
            {hero.location ? (
              <View style={s.place}>
                <Icon name="location-outline" size={13} color={colors.pink} />
                <Text style={s.placeText}>{hero.location}</Text>
              </View>
            ) : null}
            <PrimaryButton label="View Memory" onPress={openAll} style={s.viewBtn} />
          </View>

          {byYear.map(([year, items]) => (
            <View key={year} style={s.yearBlock}>
              <Text style={s.yearLabel}>
                {year}
                <Text style={s.yearCount}>
                  {'   '}
                  {items.length} memor{items.length === 1 ? 'y' : 'ies'}
                </Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {items.map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      navigation.navigate('Viewer', {
                        ids: onThisDay.map(m => m.id),
                        index: onThisDay.findIndex(m => m.id === item.id),
                        title: 'On This Day',
                      })
                    }
                    accessibilityRole="imagebutton"
                    style={s.yearThumb}>
                    <MediaThumb memory={item} style={s.fill} radius={radius.md} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          icon="time-outline"
          title="Nothing from this day — yet"
          message="Once you have memories from earlier years on today's date, they will show up here on their own."
          actionLabel="Add memories"
          onAction={() => navigation.navigate('Import')}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  fill: { width: '100%', height: '100%' },

  heroCard: {
    height: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    ...shadow.card,
  },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  heroText: { padding: spacing.xl },
  ago: { ...type.h2, color: colors.white, fontWeight: '300' },
  heroDate: { ...type.small, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  captionCard: {
    backgroundColor: colors.blush,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: -spacing.lg,
    marginHorizontal: spacing.md,
  },
  caption: {
    ...type.body,
    color: '#4A2A34',
    fontStyle: 'italic',
    lineHeight: 23,
    textAlign: 'center',
  },
  place: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  placeText: { ...type.small, color: colors.pinkPressed, marginLeft: 5 },
  viewBtn: { marginTop: spacing.lg },

  yearBlock: { marginTop: spacing.xl },
  yearLabel: { ...type.title, color: colors.text, marginBottom: spacing.md },
  yearCount: { ...type.caption, color: colors.textMuted, fontWeight: '400' },
  yearThumb: { width: 104, height: 104, marginRight: spacing.sm },
});
