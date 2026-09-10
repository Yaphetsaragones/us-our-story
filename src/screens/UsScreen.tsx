import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, fonts, gradients, radius, spacing, type } from '../theme';
import { Icon, Screen, TabSpacer } from '../components/ui';
import { useApp, useMe } from '../context/AppContext';
import { visibleMemories, yearsWithMemories } from '../lib/select';
import { daysBetween, fmtDate } from '../lib/date';
import { inviteLink } from '../lib/id';
import { formatBytes } from '../storage/media';
import type { TabProps } from '../navigation/types';

export function UsScreen({ navigation }: TabProps<'Us'>) {
  const { data } = useApp();
  const { me, partner } = useMe();
  const [copied, setCopied] = useState(false);

  const memories = useMemo(() => visibleMemories(data), [data]);
  const years = useMemo(() => yearsWithMemories(memories), [memories]);

  const photos = memories.filter(m => m.kind === 'photo').length;
  const videos = memories.length - photos;
  const hidden = data.memories.filter(m => m.hidden).length;
  const stored = data.memories.reduce((sum, m) => sum + (m.fileSize ?? 0), 0);

  const daysTogether = data.couple?.togetherSince ? daysBetween(data.couple.togetherSince) : null;
  const code = data.couple?.inviteCode ?? '';
  const cover = useMemo(
    () => memories.find(m => m.favorite && m.kind === 'photo') ?? memories.find(m => m.kind === 'photo'),
    [memories],
  );

  const copyCode = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInvite = () => {
    Share.share({
      message: `Join our private space on Us ❤️\n\nInvite code: ${code}\n${inviteLink(code)}`,
    }).catch(() => {});
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ---------------------------------------------------------- hero */}
        <View style={s.hero}>
          {cover ? (
            <Image source={{ uri: cover.uri }} style={absFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[...gradients.sunset]} style={absFill} />
          )}
          <LinearGradient
            colors={['rgba(20,10,16,0.86)', 'rgba(20,10,16,0.35)', 'rgba(20,10,16,0.9)']}
            style={absFill}
          />

          <Pressable
            onPress={() => navigation.navigate('Profile')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={s.gear}>
            <Icon name="settings-outline" size={17} color={colors.white} />
          </Pressable>

          <Text style={s.heroKicker}>
            Same{'\n'}People{'\n'}Brighter{'\n'}Days ♥
          </Text>

          <View style={s.heroBody}>
            <View style={s.heroTitleRow}>
              <Text style={s.heroTitle}>{data.couple?.title ?? 'Us'}</Text>
              <Icon name="heart-outline" size={17} color={colors.white} style={s.heroHeart} />
            </View>
            <Text style={s.heroNames}>
              {[me?.name, partner?.name].filter(Boolean).join('   &   ').toUpperCase() ||
                'JUST YOU, FOR NOW'}
            </Text>
            {data.couple?.togetherSince ? (
              <Text style={s.heroSince}>
                Together since {fmtDate(data.couple.togetherSince)}
                {daysTogether !== null ? `  •  ${daysTogether} days` : ''}
              </Text>
            ) : null}

            <View style={s.stats}>
              <Stat value={photos} label="photos" />
              <View style={s.statDivider} />
              <Stat value={videos} label="videos" />
              <View style={s.statDivider} />
              <Stat value={data.notes.length} label="notes" />
              <View style={s.statDivider} />
              <Stat value={data.story.length} label="milestones" />
            </View>
          </View>
        </View>

        {/* --------------------------------------------------- your space */}
        <SectionHeader title="Your space" script="Just the two of us ♥" />

        <Row
          icon="people-outline"
          title="Profile & names"
          subtitle="Manage your names and relationship details"
          onPress={() => navigation.navigate('Profile')}
        />
        <Row
          icon="key-outline"
          title="Invite code"
          subtitle={code || "It's all locked in"}
          onPress={copyCode}
          pill={copied ? 'Copied' : 'Tap to copy'}
        />
        <Row
          icon="share-social-outline"
          title="Share the invite"
          subtitle="Send the code and invite your partner"
          onPress={shareInvite}
        />

        {/* ----------------------------------------------------- together */}
        <SectionHeader title="Together" script="A more beautiful us ♥" />

        <Row
          icon="mail-outline"
          title="Love Notes"
          subtitle={`${data.notes.length} note${data.notes.length === 1 ? '' : 's'}`}
          onPress={() => navigation.navigate('LoveNotes')}
        />
        <Row
          icon="hourglass-outline"
          title="Countdowns"
          subtitle={`${data.countdowns.length} active`}
          onPress={() => navigation.navigate('Countdowns')}
        />
        <Row
          icon="sunny-outline"
          title="Memory of the Day"
          subtitle="Relive a special moment each day"
          onPress={() => navigation.navigate('MemoryOfTheDay')}
        />
        <Row
          icon="film-outline"
          title="Our Year"
          subtitle={
            years.length
              ? `${years.length} year${years.length === 1 ? '' : 's'} of memories`
              : 'Your year movie, once you add memories'
          }
          onPress={() => navigation.navigate('OurYear')}
        />

        {/* ----------------------------------------------------- memories */}
        <SectionHeader title="Memories" script="Everything we keep ♥" />

        <Row
          icon="images-outline"
          title="All memories"
          subtitle={`${memories.length} item${memories.length === 1 ? '' : 's'}${
            stored ? ` • ${formatBytes(stored)}` : ''
          }`}
          onPress={() => navigation.navigate('Collection', { source: 'all', title: 'All Memories' })}
        />
        <Row
          icon="star-outline"
          title="Our Favorites"
          subtitle={`${memories.filter(m => m.favorite).length} favorited`}
          onPress={() => navigation.navigate('Collection', { source: 'favorites' })}
        />
        <Row
          icon="lock-closed-outline"
          title="Privacy & Security"
          subtitle={
            data.settings.appLockEnabled
              ? `App lock on${hidden ? ` • ${hidden} hidden` : ''}`
              : 'App lock is off'
          }
          onPress={() => navigation.navigate('Privacy')}
        />

        <Text style={s.footer}>
          More than just photos and videos…{'\n'}It's your love story. ♥
        </Text>

        <TabSpacer />
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

function SectionHeader({ title, script }: { title: string; script: string }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionScript}>{script}</Text>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  pill,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  pill?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
      <View style={s.rowIcon}>
        <Icon name={icon} size={18} color={colors.pink} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={s.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {pill ? (
        <View style={s.pill}>
          <Text style={s.pillText}>{pill}</Text>
        </View>
      ) : null}
      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },

  // hero
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  gear: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.lg,
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
  heroBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  heroTitle: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 40,
    lineHeight: 48,
    color: colors.white,
  },
  heroHeart: { marginLeft: 8, marginTop: 12 },
  heroNames: { ...type.small, color: colors.white, letterSpacing: 2.5, fontWeight: '600' },
  heroSince: { ...type.caption, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...type.h3, color: colors.pink },
  statLabel: { ...type.caption, fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: -1 },
  statDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.16)' },

  // sections
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: { ...type.h3, color: colors.text },
  sectionScript: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
  },

  // rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: 'rgba(233,140,163,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...type.body, fontWeight: '700', color: colors.text },
  rowSubtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(233,140,163,0.18)',
  },
  pillText: { ...type.caption, color: colors.pink, fontWeight: '600' },

  footer: {
    fontFamily: fonts.script,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
