import React, { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme';
import { Icon, Row, Screen, ScriptTitle, SectionTitle, TabSpacer } from '../components/ui';
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

  const daysTogether = data.couple?.togetherSince
    ? daysBetween(data.couple.togetherSince)
    : null;

  const code = data.couple?.inviteCode ?? '';

  const shareInvite = () => {
    Share.share({
      message: `Join our private space on Us ❤️\n\nInvite code: ${code}\n${inviteLink(code)}`,
    }).catch(() => {});
  };

  const copyCode = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...gradients.brand]} style={s.hero}>
          <ScriptTitle text={data.couple?.title ?? 'Us'} size={44} />
          <Text style={s.names}>
            {[me?.name, partner?.name].filter(Boolean).join('  &  ') || 'Just you, for now'}
          </Text>
          {data.couple?.togetherSince ? (
            <Text style={s.since}>
              Together since {fmtDate(data.couple.togetherSince)}
              {daysTogether !== null ? `  •  ${daysTogether.toLocaleString()} days` : ''}
            </Text>
          ) : null}

          <View style={s.statsRow}>
            <Stat value={photos} label="Photos" />
            <Stat value={videos} label="Videos" />
            <Stat value={data.notes.length} label="Notes" />
            <Stat value={data.story.length} label="Milestones" />
          </View>
        </LinearGradient>

        <View style={s.section}>
          <SectionTitle title="Your space" />
          <Row
            icon="person-circle-outline"
            title="Profile & names"
            subtitle="Names, birthdays, your together-since date"
            onPress={() => navigation.navigate('Profile')}
          />
          <Row
            icon="key-outline"
            title="Invite code"
            subtitle={code}
            onPress={copyCode}
            right={
              <Text style={s.copyHint}>{copied ? 'Copied' : 'Tap to copy'}</Text>
            }
          />
          <Row
            icon="share-social-outline"
            title="Share the invite"
            subtitle="Send the code and link to your partner"
            onPress={shareInvite}
          />
        </View>

        <View style={s.section}>
          <SectionTitle title="Together" />
          <Row
            icon="mail-outline"
            title="Love Notes"
            subtitle={`${data.notes.length} note${data.notes.length === 1 ? '' : 's'}`}
            onPress={() => navigation.navigate('LoveNotes')}
          />
          <Row
            icon="hourglass-outline"
            title="Countdowns"
            subtitle={`${data.countdowns.length} counting down`}
            onPress={() => navigation.navigate('Countdowns')}
          />
          <Row
            icon="time-outline"
            title="Memory of the Day"
            subtitle="Relive a special moment every day"
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
        </View>

        <View style={s.section}>
          <SectionTitle title="Memories" />
          <Row
            icon="images-outline"
            title="All memories"
            subtitle={`${memories.length} item${memories.length === 1 ? '' : 's'}${stored ? ` • ${formatBytes(stored)}` : ''}`}
            onPress={() =>
              navigation.navigate('Collection', { source: 'all', title: 'All Memories' })
            }
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
        </View>

        <View style={s.footer}>
          <Icon name="heart" size={14} color={colors.pink} />
          <Text style={s.footerText}>
            More than just photos and videos…{'\n'}It's your love story.
          </Text>
        </View>

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

const s = StyleSheet.create({
  content: { paddingBottom: spacing.xl },

  hero: {
    margin: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  names: { ...type.h3, color: colors.white, fontWeight: '400', marginTop: -spacing.xs },
  since: { ...type.caption, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xl,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...type.h3, color: colors.white },
  statLabel: { ...type.caption, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  copyHint: { ...type.caption, color: colors.pink },

  footer: { alignItems: 'center', paddingVertical: spacing.xl },
  footerText: {
    ...type.small,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
