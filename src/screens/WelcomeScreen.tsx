import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, gradients, spacing, type } from '../theme';
import { GhostButton, Icon, PrimaryButton, ScriptTitle } from '../components/ui';
import type { RootProps } from '../navigation/types';

const PROMISES = [
  { icon: 'images-outline', label: 'Photos\n& Videos' },
  { icon: 'calendar-outline', label: 'Organize\nby Date' },
  { icon: 'heart-outline', label: 'Share\nTogether' },
  { icon: 'lock-closed-outline', label: 'Keep it\nPrivate' },
];

export function WelcomeScreen({ navigation }: RootProps<'Welcome'>) {
  return (
    <LinearGradient colors={[...gradients.sunset]} style={s.fill}>
      <View style={s.veil} />
      <View style={s.content}>
        <View style={s.hero}>
          <ScriptTitle text="Us" size={82} />
          <Text style={s.kicker}>OUR STORY</Text>
          <Text style={s.tagline}>
            A private space for two{'\n'}to collect, cherish, and relive{'\n'}your best moments.
          </Text>
        </View>

        <View style={s.promises}>
          {PROMISES.map(p => (
            <View key={p.icon} style={s.promise}>
              <View style={s.promiseIcon}>
                <Icon name={p.icon} size={21} color={colors.white} />
              </View>
              <Text style={s.promiseLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.actions}>
          <PrimaryButton
            label="Start our story"
            icon="heart"
            onPress={() => navigation.navigate('CreateCouple')}
          />
          <GhostButton
            label="I have an invite code"
            onPress={() => navigation.navigate('JoinCouple')}
            style={s.secondary}
          />
          <Text style={s.footnote}>
            Everything stays on this phone. Nothing is uploaded anywhere.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  veil: { ...absFill, backgroundColor: 'rgba(20,10,16,0.42)' },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 1.6,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },

  hero: { alignItems: 'center' },
  kicker: {
    ...type.caption,
    color: colors.white,
    letterSpacing: 5,
    marginTop: -spacing.sm,
    opacity: 0.9,
  },
  tagline: {
    ...type.body,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 24,
    opacity: 0.94,
  },

  promises: { flexDirection: 'row', justifyContent: 'space-between' },
  promise: { alignItems: 'center', flex: 1 },
  promiseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(30,15,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  promiseLabel: {
    ...type.caption,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 15,
  },

  actions: {},
  secondary: { marginTop: spacing.md, borderColor: 'rgba(255,255,255,0.4)' },
  footnote: {
    ...type.caption,
    color: colors.white,
    opacity: 0.75,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
