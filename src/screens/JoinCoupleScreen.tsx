import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';
import { Field, Header, Icon, PrimaryButton, Screen } from '../components/ui';
import { normalizeCode } from '../lib/id';
import { useApp } from '../context/AppContext';
import type { RootProps } from '../navigation/types';

export function JoinCoupleScreen({ navigation }: RootProps<'JoinCouple'>) {
  const { joinCouple } = useApp();
  const [code, setCode] = useState('');
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');

  const valid = code.replace(/[^A-Z0-9]/g, '').length === 8 && myName.trim().length > 0;

  const onSubmit = () => {
    joinCouple({ code, myName, partnerName });
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <Screen>
      <Header title="Join your partner" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.lead}>
            Enter the code your partner shared with you and this phone becomes your side of the
            same space.
          </Text>

          <Field
            label="INVITE CODE"
            value={code}
            onChangeText={v => setCode(normalizeCode(v))}
            placeholder="ABCD-1234"
            autoCapitalize="characters"
            maxLength={9}
          />

          <Field
            label="YOUR NAME"
            value={myName}
            onChangeText={setMyName}
            placeholder="What should we call you?"
            autoCapitalize="words"
            maxLength={40}
          />

          <Field
            label="YOUR PARTNER'S NAME (OPTIONAL)"
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Who invited you?"
            autoCapitalize="words"
            maxLength={40}
          />

          <View style={s.note}>
            <Icon name="information-circle-outline" size={17} color={colors.pink} />
            <Text style={s.noteText}>
              Memories live on each phone for now. Adding a sync server is the one piece this
              app leaves open — see the README for where it plugs in.
            </Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Join the space" onPress={onSubmit} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  lead: { ...type.body, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.xl },
  note: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
  },
  noteText: {
    ...type.small,
    color: colors.textMuted,
    lineHeight: 19,
    flex: 1,
    marginLeft: spacing.md,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
