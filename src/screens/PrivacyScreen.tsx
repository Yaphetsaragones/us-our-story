/** Privacy & Security — app lock, hidden memories, and starting over. */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme';
import {
  GhostButton,
  Header,
  Icon,
  Row,
  Screen,
  Toggle,
} from '../components/ui';
import { PromptModal } from '../components/PromptModal';
import { useApp } from '../context/AppContext';
import { useLock } from '../context/LockContext';
import type { RootProps } from '../navigation/types';

const ASSURANCES = [
  { icon: 'people-outline', text: 'Private account for two' },
  { icon: 'key-outline', text: 'Invite your partner with a secure code / link' },
  { icon: 'cloud-offline-outline', text: 'Photos & videos never leave this phone' },
  { icon: 'finger-print', text: 'App lock with biometrics or passcode' },
  { icon: 'eye-off-outline', text: 'Hide specific memories' },
];

export function PrivacyScreen({ navigation }: RootProps<'Privacy'>) {
  const { data, updateSettings, setPasscode, clearPasscode, resetEverything } = useApp();
  const { biometryAvailable, biometryLabel } = useLock();
  const [settingCode, setSettingCode] = useState(false);

  const { appLockEnabled, biometricsEnabled, showHiddenMemories } = data.settings;
  const hiddenCount = data.memories.filter(m => m.hidden).length;

  const onLockToggle = (next: boolean) => {
    if (next) setSettingCode(true);
    else
      Alert.alert('Turn off app lock?', 'Anyone who opens the app will see your memories.', [
        { text: 'Keep it on', style: 'cancel' },
        { text: 'Turn off', style: 'destructive', onPress: clearPasscode },
      ]);
  };

  const savePasscode = (value: string) => {
    if (!/^\d{4}$/.test(value)) {
      Alert.alert('Four digits', 'Your passcode needs to be exactly 4 numbers.');
      return;
    }
    setPasscode(value);
    setSettingCode(false);
    Alert.alert('App lock is on', 'Us will ask for this code whenever you come back.');
  };

  const onBiometricsToggle = (next: boolean) => {
    if (next && !appLockEnabled) {
      Alert.alert('Set a passcode first', 'Biometrics need a passcode as a fallback.');
      return;
    }
    if (next && !biometryAvailable) {
      Alert.alert(
        'Not available',
        'This device has no biometric sensor set up, so the passcode stays the way in.',
      );
      return;
    }
    updateSettings({ biometricsEnabled: next });
  };

  const confirmReset = () =>
    Alert.alert(
      'Delete everything?',
      'Every memory, note, countdown and milestone in Us is removed from this phone. Photos in your gallery are untouched. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await resetEverything();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ],
    );

  return (
    <Screen>
      <Header title="Privacy & Security" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...gradients.dusk]} style={s.hero}>
          <View style={s.heroIcon}>
            <Icon name="lock-closed" size={24} color={colors.pink} />
          </View>
          <Text style={s.heroTitle}>Your Privacy Matters</Text>
          <View style={s.assurances}>
            {ASSURANCES.map(a => (
              <View key={a.text} style={s.assurance}>
                <View style={s.assuranceIcon}>
                  <Icon name={a.icon} size={15} color={colors.pinkSoft} />
                </View>
                <Text style={s.assuranceText}>{a.text}</Text>
              </View>
            ))}
          </View>
          <Text style={s.heroFooter}>Because your love story is yours alone.</Text>
        </LinearGradient>

        <View style={s.section}>
          <Row
            icon="lock-closed-outline"
            title="App lock"
            subtitle={appLockEnabled ? 'A 4-digit passcode is set' : 'Off'}
            right={<Toggle value={appLockEnabled} onChange={onLockToggle} />}
          />
          <Row
            icon="finger-print"
            title={`Unlock with ${biometryLabel}`}
            subtitle={
              biometryAvailable
                ? 'Skip the passcode when your face or finger is enough'
                : 'No biometric sensor set up on this device'
            }
            right={<Toggle value={biometricsEnabled} onChange={onBiometricsToggle} />}
          />
          {appLockEnabled ? (
            <Row
              icon="create-outline"
              title="Change passcode"
              onPress={() => setSettingCode(true)}
            />
          ) : null}
        </View>

        <View style={s.section}>
          <Row
            icon="eye-off-outline"
            title="Hidden memories"
            subtitle={`${hiddenCount} hidden — kept, but out of every browse screen`}
            onPress={
              hiddenCount
                ? () => navigation.navigate('Collection', { source: 'hidden' })
                : undefined
            }
          />
          <Row
            icon="eye-outline"
            title="Show hidden memories"
            subtitle="Temporarily reveal them everywhere in the app"
            right={
              <Toggle
                value={showHiddenMemories}
                onChange={v => updateSettings({ showHiddenMemories: v })}
              />
            }
          />
        </View>

        <View style={s.section}>
          <Text style={s.note}>
            Us keeps everything in this app's private storage on this phone. There is no account
            server, no analytics and no upload — which also means a phone reset takes your
            memories with it, so keep your own backups of anything precious.
          </Text>
          <GhostButton
            label="Delete everything"
            icon="trash-outline"
            tone="danger"
            onPress={confirmReset}
            style={s.resetBtn}
          />
        </View>
      </ScrollView>

      <PromptModal
        visible={settingCode}
        title={appLockEnabled ? 'Change passcode' : 'Set a passcode'}
        message="Four digits. You will need it every time you come back to Us."
        placeholder="1234"
        confirmLabel="Set"
        maxLength={4}
        keyboardType="number-pad"
        secure
        onCancel={() => setSettingCode(false)}
        onSubmit={savePasscode}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  hero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(233,140,163,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { ...type.h2, color: colors.white, fontWeight: '500' },
  assurances: { alignSelf: 'stretch', marginTop: spacing.xl },
  assurance: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  assuranceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  assuranceText: { ...type.small, color: colors.textSoft, flex: 1, lineHeight: 19 },
  heroFooter: {
    ...type.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },

  section: { marginTop: spacing.xl },
  note: { ...type.small, color: colors.textFaint, lineHeight: 19, marginBottom: spacing.lg },
  resetBtn: { borderColor: 'rgba(228,103,107,0.4)' },
});
