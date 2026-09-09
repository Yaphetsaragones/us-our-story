import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, radius, spacing, type } from '../theme';
import { Chip, EmptyState, Header, Icon, PrimaryButton, Screen } from '../components/ui';
import { useApp } from '../context/AppContext';
import { visibleMemories, yearStats, yearsWithMemories } from '../lib/select';
import type { RootProps } from '../navigation/types';

export function OurYearScreen({ navigation, route }: RootProps<'OurYear'>) {
  const { data } = useApp();
  const memories = useMemo(() => visibleMemories(data), [data]);
  const years = useMemo(() => yearsWithMemories(memories), [memories]);

  const [year, setYear] = useState(
    route.params?.year ?? years[0] ?? new Date().getFullYear(),
  );

  const stats = useMemo(() => yearStats(data, year), [data, year]);
  const mosaic = useMemo(
    () => stats.memories.filter(m => m.kind === 'photo').slice(0, 12),
    [stats.memories],
  );

  if (!years.length) {
    return (
      <Screen>
        <Header title="Our Year" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="film-outline"
          title="Your year movie is waiting"
          message="Add memories across the year and the app gathers the highlights into a reel you can play back."
          actionLabel="Add memories"
          onAction={() => navigation.navigate('Import')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Our Year" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {years.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.years}>
            {years.map(y => (
              <Chip key={y} label={String(y)} active={y === year} onPress={() => setYear(y)} />
            ))}
          </ScrollView>
        ) : null}

        <View style={s.poster}>
          <View style={s.mosaic}>
            {mosaic.map(m => (
              <Image key={m.id} source={{ uri: m.uri }} style={s.mosaicTile} resizeMode="cover" />
            ))}
          </View>
          <LinearGradient
            colors={['rgba(15,12,14,0.55)', 'rgba(15,12,14,0.92)']}
            style={absFill}
          />

          <View style={s.posterBody}>
            <Text style={s.posterKicker}>Our Year</Text>
            <Text style={s.posterYear}>{year}</Text>
            <Icon name="heart" size={16} color={colors.pink} />

            <View style={s.statsRow}>
              <Stat value={stats.photos} label="Photos" />
              <Stat value={stats.videos} label="Videos" />
              <Stat value={stats.moments} label="Moments" />
              <Stat value={stats.daysTogether} label="Days Together" />
            </View>

            <Pressable
              onPress={() => navigation.navigate('YearMovie', { year })}
              accessibilityRole="button"
              accessibilityLabel={`Play the ${year} movie`}
              style={({ pressed }) => [s.play, pressed && s.pressed]}>
              <Icon name="play" size={26} color={colors.white} />
            </Pressable>

            <Text style={s.posterLine}>
              A year of love, laughter{'\n'}and unforgettable moments.
            </Text>

            <PrimaryButton
              label="Watch Our Year"
              onPress={() => navigation.navigate('YearMovie', { year })}
              style={s.watchBtn}
            />
          </View>
        </View>

        <View style={s.detail}>
          <DetailRow
            icon="star-outline"
            label="Favorites"
            value={`${stats.favorites} memor${stats.favorites === 1 ? 'y' : 'ies'}`}
            onPress={() => navigation.navigate('Collection', { source: 'favorites' })}
          />
          <DetailRow
            icon="location-outline"
            label="Places"
            value={stats.places.length ? stats.places.slice(0, 3).join(', ') : 'None tagged yet'}
          />
          <DetailRow
            icon="images-outline"
            label="Everything from this year"
            value={`${stats.memories.length} item${stats.memories.length === 1 ? '' : 's'}`}
            onPress={() =>
              navigation.navigate('Viewer', {
                ids: stats.memories.map(m => m.id),
                index: 0,
                title: `Our ${year}`,
              })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value.toLocaleString()}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Icon name={icon} size={18} color={colors.pink} />
      <View style={s.detailBody}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {onPress ? <Icon name="chevron-forward" size={15} color={colors.textFaint} /> : null}
    </>
  );
  if (!onPress) return <View style={s.detailRow}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.detailRow, pressed && s.pressed]}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.8 },
  years: { paddingBottom: spacing.lg },

  poster: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    minHeight: 460,
  },
  mosaic: { ...absFill, flexDirection: 'row', flexWrap: 'wrap' },
  mosaicTile: { width: '25%', height: '25%' },
  posterBody: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  posterKicker: { ...type.h3, color: colors.white, fontWeight: '300' },
  posterYear: { fontSize: 62, lineHeight: 70, fontWeight: '700', color: colors.white },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xl,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...type.h3, color: colors.white },
  statLabel: { ...type.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' },

  play: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    paddingLeft: 4,
  },
  posterLine: {
    ...type.small,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.lg,
  },
  watchBtn: { marginTop: spacing.lg, alignSelf: 'stretch' },

  detail: { marginTop: spacing.xl },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  detailBody: { flex: 1, marginLeft: spacing.md },
  detailLabel: { ...type.caption, color: colors.textMuted },
  detailValue: { ...type.body, color: colors.text, marginTop: 2 },
});
