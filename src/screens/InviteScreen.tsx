import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme';
import { GhostButton, Header, Icon, PrimaryButton, Screen } from '../components/ui';
import { inviteLink } from '../lib/id';
import { useApp } from '../context/AppContext';
import type { RootProps } from '../navigation/types';

export function InviteScreen({ navigation }: RootProps<'Invite'>) {
  const { data } = useApp();
  const [copied, setCopied] = useState(false);
  const code = data.couple?.inviteCode ?? '';

  const copy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    Share.share({
      message: `Join our private space on Us ❤️\n\nInvite code: ${code}\n${inviteLink(code)}`,
    }).catch(() => {});
  };

  const done = () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

  return (
    <Screen>
      <Header title="Invite your partner" right={<View style={s.spacer} />} />
      <View style={s.content}>
        <View style={s.top}>
          <LinearGradient colors={[...gradients.brand]} style={s.badge}>
            <Icon name="heart" size={30} color={colors.white} />
          </LinearGradient>

          <Text style={s.title}>Your space is ready</Text>
          <Text style={s.lead}>
            Share this code with your partner. When they enter it, this becomes a space for the
            two of you.
          </Text>

          <View style={s.codeCard}>
            <Text style={s.codeLabel}>INVITE CODE</Text>
            <Text style={s.code} selectable>
              {code}
            </Text>
            <View style={s.codeActions}>
              <GhostButton
                label={copied ? 'Copied' : 'Copy code'}
                icon={copied ? 'checkmark' : 'copy-outline'}
                onPress={copy}
                style={s.codeBtn}
              />
              <GhostButton
                label="Share link"
                icon="share-outline"
                onPress={share}
                style={s.codeBtn}
              />
            </View>
          </View>
        </View>

        <View>
          <PrimaryButton label="Enter our space" icon="arrow-forward" onPress={done} />
          <Text style={s.footnote}>You can find this code again any time under Us.</Text>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  spacer: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', paddingTop: spacing.xl },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  lead: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  codeCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  codeLabel: { ...type.caption, color: colors.textMuted, letterSpacing: 2 },
  code: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: colors.pink,
    letterSpacing: 4,
    marginTop: spacing.sm,
  },
  codeActions: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.md },
  codeBtn: { flex: 1 },
  footnote: {
    ...type.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
