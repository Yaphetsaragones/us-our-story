import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';
import { Field, Header, PrimaryButton, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { useApp } from '../context/AppContext';
import type { RootProps } from '../navigation/types';

export function CreateCoupleScreen({ navigation }: RootProps<'CreateCouple'>) {
  const { createCouple } = useApp();
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [togetherSince, setTogetherSince] = useState<number | undefined>();

  const canContinue = myName.trim().length > 0;

  const onSubmit = () => {
    createCouple({ myName, partnerName, togetherSince });
    navigation.replace('Invite');
  };

  return (
    <Screen>
      <Header title="Create your space" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.lead}>
            Two names and a date. That is the whole setup — everything else grows from the
            memories you add.
          </Text>

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
            placeholder="They can change this when they join"
            autoCapitalize="words"
            maxLength={40}
          />

          <DateField
            label="TOGETHER SINCE (OPTIONAL)"
            value={togetherSince}
            onChange={setTogetherSince}
            placeholder="The day it all started"
            maximumDate={new Date()}
          />

          <View style={s.note}>
            <Text style={s.noteText}>
              We use this date for your anniversary countdown, your "days together" count, and
              the Anniversaries collection.
            </Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Continue" onPress={onSubmit} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  lead: {
    ...type.body,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  note: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
  },
  noteText: { ...type.small, color: colors.textMuted, lineHeight: 19 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
