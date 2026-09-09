import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { Field, GhostButton, Header, Icon, PrimaryButton, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { MemoryTile } from '../components/media';
import { useApp } from '../context/AppContext';
import { visibleMemories } from '../lib/select';
import type { StoryKind } from '../types';
import type { RootProps } from '../navigation/types';

const KINDS: { kind: StoryKind; label: string; icon: string }[] = [
  { kind: 'first-message', label: 'First message', icon: 'chatbubble-ellipses-outline' },
  { kind: 'first-date', label: 'First date', icon: 'heart-outline' },
  { kind: 'first-trip', label: 'First trip', icon: 'airplane-outline' },
  { kind: 'anniversary', label: 'Anniversary', icon: 'infinite-outline' },
  { kind: 'milestone', label: 'Milestone', icon: 'ribbon-outline' },
  { kind: 'future', label: 'Future plan', icon: 'telescope-outline' },
];

export function StoryEventEditScreen({ navigation, route }: RootProps<'StoryEventEdit'>) {
  const { data, addStoryEvent, updateStoryEvent, deleteStoryEvent } = useApp();
  const existing = route.params?.id
    ? data.story.find(e => e.id === route.params.id)
    : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState<number | undefined>(existing?.date);
  const [kind, setKind] = useState<StoryKind>(existing?.kind ?? 'milestone');
  const [memoryIds, setMemoryIds] = useState<string[]>(existing?.memoryIds ?? []);

  const memories = visibleMemories(data).slice(0, 60);
  const valid = title.trim().length > 0 && !!date;

  const save = () => {
    if (!valid || !date) return;
    const payload = { title: title.trim(), note: note.trim() || undefined, date, kind, memoryIds };
    if (existing) updateStoryEvent(existing.id, payload);
    else addStoryEvent(payload);
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(`Remove "${existing.title}"?`, 'The memories you linked stay in Us.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteStoryEvent(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const toggleMemory = (id: string) =>
    setMemoryIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <Screen>
      <Header
        title={existing ? 'Edit milestone' : 'Add a milestone'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.label}>WHAT KIND OF MOMENT</Text>
          <View style={s.kinds}>
            {KINDS.map(option => {
              const on = option.kind === kind;
              return (
                <Pressable
                  key={option.kind}
                  onPress={() => setKind(option.kind)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[s.kind, on && s.kindOn]}>
                  <Icon
                    name={option.icon}
                    size={15}
                    color={on ? colors.white : colors.textMuted}
                  />
                  <Text style={[s.kindText, on && s.kindTextOn]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="TITLE"
            value={title}
            onChangeText={setTitle}
            placeholder="The night we first talked"
            maxLength={80}
          />
          <DateField label="WHEN" value={date} onChange={setDate} />
          <Field
            label="A LINE ABOUT IT (OPTIONAL)"
            value={note}
            onChangeText={setNote}
            placeholder="Neither of us slept that night."
            multiline
            maxLength={280}
          />

          {memories.length ? (
            <>
              <Text style={s.label}>LINK MEMORIES (OPTIONAL)</Text>
              <Text style={s.hint}>Tap the photos and videos that belong to this moment.</Text>
              <View style={s.grid}>
                {memories.map(m => (
                  <MemoryTile
                    key={m.id}
                    memory={m}
                    size={78}
                    selected={memoryIds.includes(m.id)}
                    onPress={() => toggleMemory(m.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {existing ? (
            <GhostButton
              label="Remove this milestone"
              icon="trash-outline"
              tone="danger"
              onPress={confirmDelete}
              style={s.deleteBtn}
            />
          ) : null}
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Save" onPress={save} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  label: { ...type.caption, color: colors.textMuted, letterSpacing: 1.5, marginBottom: spacing.sm },
  hint: { ...type.small, color: colors.textFaint, marginBottom: spacing.md },

  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kindOn: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  kindText: { ...type.small, color: colors.textMuted, marginLeft: 6 },
  kindTextOn: { color: colors.white, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  deleteBtn: { marginTop: spacing.xl },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
