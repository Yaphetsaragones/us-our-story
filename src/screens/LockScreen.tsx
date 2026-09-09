/** Shown over everything while the space is locked. */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme';
import { Icon, ScriptTitle } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useLock } from '../context/LockContext';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
const LENGTH = 4;

export function LockScreen() {
  const { data } = useApp();
  const { biometryAvailable, biometryLabel, unlockWithBiometrics, unlockWithPasscode } = useLock();
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const biometricsOn = data.settings.biometricsEnabled && biometryAvailable;

  // Offer the biometric prompt straight away rather than making people tap first.
  useEffect(() => {
    if (biometricsOn) unlockWithBiometrics();
  }, [biometricsOn, unlockWithBiometrics]);

  useEffect(() => {
    if (entry.length < LENGTH) return;
    if (unlockWithPasscode(entry)) return;
    setError(true);
    const t = setTimeout(() => {
      setEntry('');
      setError(false);
    }, 600);
    return () => clearTimeout(t);
  }, [entry, unlockWithPasscode]);

  const press = (key: string) => {
    if (key === 'bio') {
      if (biometricsOn) unlockWithBiometrics();
      return;
    }
    if (key === 'del') {
      setEntry(prev => prev.slice(0, -1));
      return;
    }
    setEntry(prev => (prev.length >= LENGTH ? prev : prev + key));
  };

  return (
    <LinearGradient colors={[...gradients.dusk]} style={s.fill}>
      <View style={s.content}>
        <View style={s.head}>
          <View style={s.lock}>
            <Icon name="lock-closed" size={24} color={colors.pink} />
          </View>
          <ScriptTitle text="Us" size={50} />
          <Text style={s.hint}>
            {error ? 'That code is not right' : 'Enter your passcode to unlock'}
          </Text>
        </View>

        <View style={s.dots}>
          {Array.from({ length: LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[s.dot, i < entry.length && s.dotFilled, error && s.dotError]}
            />
          ))}
        </View>

        <View style={s.pad}>
          {KEYS.map(key => {
            if (key === 'bio' && !biometricsOn) return <View key={key} style={s.key} />;
            return (
              <Pressable
                key={key}
                onPress={() => press(key)}
                accessibilityRole="button"
                accessibilityLabel={
                  key === 'bio' ? `Unlock with ${biometryLabel}` : key === 'del' ? 'Delete' : key
                }
                style={({ pressed }) => [s.key, pressed && s.keyPressed]}>
                {key === 'bio' ? (
                  <Icon name="finger-print" size={26} color={colors.pink} />
                ) : key === 'del' ? (
                  <Icon name="backspace-outline" size={24} color={colors.textMuted} />
                ) : (
                  <Text style={s.keyText}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={s.footer}>Because your love story is yours alone.</Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  head: { alignItems: 'center', marginTop: spacing.xxl },
  lock: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(233,140,163,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  hint: { ...type.small, color: colors.textMuted, marginTop: spacing.sm },

  dots: { flexDirection: 'row', gap: spacing.lg },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
  },
  dotFilled: { backgroundColor: colors.pink, borderColor: colors.pink },
  dotError: { borderColor: colors.danger },

  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 268, justifyContent: 'center' },
  key: {
    width: 76,
    height: 68,
    margin: 4,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  keyText: { fontSize: 26, fontWeight: '400', color: colors.text },

  footer: { ...type.caption, color: colors.textFaint },
});
