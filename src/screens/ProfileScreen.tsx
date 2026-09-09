import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { Field, Header, Icon, PrimaryButton, Row, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { useApp, useMe } from '../context/AppContext';
import type { RootProps } from '../navigation/types';

export function ProfileScreen({ navigation }: RootProps<'Profile'>) {
  const { data, updateCouple, updateMember, updateSettings, regenerateInviteCode } = useApp();
  const { me, partner } = useMe();

  const [title, setTitle] = useState(data.couple?.title ?? 'Us');
  const [myName, setMyName] = useState(me?.name ?? '');
  const [partnerName, setPartnerName] = useState(partner?.name ?? '');
  const [myBirthday, setMyBirthday] = useState(me?.birthday);
  const [partnerBirthday, setPartnerBirthday] = useState(partner?.birthday);
  const [since, setSince] = useState(data.couple?.togetherSince);
  const [code, setCode] = useState(data.couple?.inviteCode ?? '');

  const save = () => {
    updateCouple({ title: title.trim() || 'Us', togetherSince: since });
    if (me) updateMember(me.id, { name: myName.trim() || me.name, birthday: myBirthday });
    if (partner) {
      updateMember(partner.id, {
        name: partnerName.trim() || partner.name,
        birthday: partnerBirthday,
      });
    }
    navigation.goBack();
  };

  const slideshow = data.settings.slideshowSeconds;

  const cycleSlideshow = () => {
    const options = [2.5, 3.5, 5, 7];
    const next = options[(options.indexOf(slideshow) + 1) % options.length] ?? 3.5;
    updateSettings({ slideshowSeconds: next });
  };

  return (
    <Screen>
      <Header title="Profile" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Field
            label="WHAT YOU CALL THIS SPACE"
            value={title}
            onChangeText={setTitle}
            placeholder="Us"
            maxLength={24}
          />
          <DateField
            label="TOGETHER SINCE"
            value={since}
            onChange={setSince}
            placeholder="The day it all started"
            maximumDate={new Date()}
          />

          <Text style={s.sectionLabel}>YOU</Text>
          <Field
            label="NAME"
            value={myName}
            onChangeText={setMyName}
            placeholder="Your name"
            autoCapitalize="words"
            maxLength={40}
          />
          <DateField
            label="BIRTHDAY"
            value={myBirthday}
            onChange={setMyBirthday}
            placeholder="Adds to the Birthdays collection"
            maximumDate={new Date()}
          />

          {partner ? (
            <>
              <Text style={s.sectionLabel}>YOUR PARTNER</Text>
              <Field
                label="NAME"
                value={partnerName}
                onChangeText={setPartnerName}
                placeholder="Their name"
                autoCapitalize="words"
                maxLength={40}
              />
              <DateField
                label="BIRTHDAY"
                value={partnerBirthday}
                onChange={setPartnerBirthday}
                placeholder="Adds to the Birthdays collection"
                maximumDate={new Date()}
              />
            </>
          ) : null}

          <Text style={s.sectionLabel}>PREFERENCES</Text>
          <Row
            icon="timer-outline"
            title="Slideshow pace"
            subtitle={`${slideshow}s per photo in the year movie`}
            onPress={cycleSlideshow}
            right={<Text style={s.value}>{slideshow}s</Text>}
          />
          <Row
            icon="key-outline"
            title="Invite code"
            subtitle={code}
            onPress={() => setCode(regenerateInviteCode())}
            right={<Text style={s.value}>New code</Text>}
          />

          <View style={s.note}>
            <Icon name="information-circle-outline" size={16} color={colors.pink} />
            <Text style={s.noteText}>
              Birthdays fill the Birthdays collection automatically, and your together-since date
              drives the anniversary countdown and the Anniversaries collection.
            </Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Save" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  sectionLabel: {
    ...type.caption,
    color: colors.pink,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  value: { ...type.small, color: colors.pink, fontWeight: '600' },
  note: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  noteText: { ...type.small, color: colors.textMuted, flex: 1, marginLeft: spacing.md, lineHeight: 19 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
