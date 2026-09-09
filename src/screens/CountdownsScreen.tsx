import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import {
  EmptyState,
  Field,
  GhostButton,
  Header,
  Icon,
  PrimaryButton,
  Screen,
  Toggle,
} from '../components/ui';
import { DateField } from '../components/DateField';
import { useApp } from '../context/AppContext';
import { daysUntil, fmtDate, nextOccurrence } from '../lib/date';
import type { RootProps } from '../navigation/types';

const ICONS = [
  'heart-outline',
  'airplane-outline',
  'gift-outline',
  'sparkles-outline',
  'home-outline',
  'restaurant-outline',
];

export function CountdownsScreen({ navigation }: RootProps<'Countdowns'>) {
  const { data, addCountdown, deleteCountdown } = useApp();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<number | undefined>();
  const [icon, setIcon] = useState(ICONS[0]);
  const [yearly, setYearly] = useState(false);

  const items = useMemo(() => {
    const base = data.countdowns.map(c => ({
      ...c,
      due: c.repeatsYearly ? nextOccurrence(c.date) : c.date,
    }));
    const anniversary = data.couple?.togetherSince
      ? [
          {
            id: 'built_in_anniversary',
            title: 'Our Anniversary',
            icon: 'infinite-outline',
            date: data.couple.togetherSince,
            repeatsYearly: true,
            createdAt: data.couple.createdAt,
            due: nextOccurrence(data.couple.togetherSince),
          },
        ]
      : [];
    return [...anniversary, ...base].sort((a, b) => a.due - b.due);
  }, [data.countdowns, data.couple]);

  const reset = () => {
    setComposing(false);
    setTitle('');
    setDate(undefined);
    setIcon(ICONS[0]);
    setYearly(false);
  };

  const save = () => {
    if (!title.trim() || !date) return;
    addCountdown({ title: title.trim(), date, icon, repeatsYearly: yearly });
    reset();
  };

  const confirmDelete = (id: string, name: string) => {
    if (id === 'built_in_anniversary') {
      Alert.alert(
        'Your anniversary',
        'This one comes from your "together since" date. Change it under Us.',
      );
      return;
    }
    Alert.alert(`Remove "${name}"?`, undefined, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteCountdown(id) },
    ]);
  };

  return (
    <Screen>
      <Header title="Countdowns" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {items.length ? (
          items.map(item => {
            const days = daysUntil(item.due);
            return (
              <Pressable
                key={item.id}
                onLongPress={() => confirmDelete(item.id, item.title)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${days} days away`}
                style={({ pressed }) => [s.card, pressed && s.pressed]}>
                <View style={s.cardIcon}>
                  <Icon name={item.icon} size={20} color={colors.white} />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.cardDate}>
                    {fmtDate(item.due)}
                    {item.repeatsYearly ? ' • every year' : ''}
                  </Text>
                </View>
                <View style={s.cardCount}>
                  <Text style={s.days}>{days === 0 ? 'Today' : days}</Text>
                  {days !== 0 ? <Text style={s.daysLabel}>days</Text> : null}
                </View>
              </Pressable>
            );
          })
        ) : (
          <EmptyState
            icon="hourglass-outline"
            title="What are you looking forward to?"
            message="Anniversaries, trips, birthdays, the day you next see each other — keep the wait in one place."
          />
        )}

        <GhostButton
          label="Add Countdown"
          icon="add"
          onPress={() => setComposing(true)}
          style={s.addBtn}
        />

        {items.length ? (
          <Text style={s.hint}>Long-press a countdown to remove it.</Text>
        ) : null}
      </ScrollView>

      <Modal visible={composing} animationType="slide" transparent onRequestClose={reset}>
        <View style={s.sheetBackdrop}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>New countdown</Text>

            <Field
              label="WHAT ARE YOU WAITING FOR?"
              value={title}
              onChangeText={setTitle}
              placeholder="Our Anniversary"
              maxLength={60}
              autoFocus
            />
            <DateField label="WHEN" value={date} onChange={setDate} />

            <Text style={s.fieldLabel}>ICON</Text>
            <View style={s.icons}>
              {ICONS.map(name => (
                <Pressable
                  key={name}
                  onPress={() => setIcon(name)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: icon === name }}
                  style={[s.iconOption, icon === name && s.iconOptionOn]}>
                  <Icon
                    name={name}
                    size={19}
                    color={icon === name ? colors.white : colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>

            <View style={s.yearlyRow}>
              <Text style={s.yearlyLabel}>Repeat every year</Text>
              <Toggle value={yearly} onChange={setYearly} />
            </View>

            <View style={s.sheetActions}>
              <GhostButton label="Cancel" onPress={reset} style={s.sheetBtn} />
              <PrimaryButton
                label="Add"
                onPress={save}
                disabled={!title.trim() || !date}
                style={s.sheetBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...type.body, fontWeight: '600', color: colors.text },
  cardDate: { ...type.caption, color: colors.textMuted, marginTop: 3 },
  cardCount: { alignItems: 'flex-end', minWidth: 54 },
  days: { ...type.h2, color: colors.pink },
  daysLabel: { ...type.caption, color: colors.textMuted, marginTop: -2 },

  addBtn: { marginTop: spacing.md },
  hint: { ...type.caption, color: colors.textFaint, textAlign: 'center', marginTop: spacing.lg },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { ...type.h3, color: colors.text, marginBottom: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm },
  icons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionOn: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  yearlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  yearlyLabel: { ...type.body, color: colors.text },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  sheetBtn: { flex: 1 },
});
