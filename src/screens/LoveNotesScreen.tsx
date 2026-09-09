/** Private messages between the two of you — the light, blush corner of the app. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { EmptyState, Header, Icon, Screen } from '../components/ui';
import { useApp, useMe } from '../context/AppContext';
import { fmtNoteStamp } from '../lib/date';
import type { RootProps } from '../navigation/types';

export function LoveNotesScreen({ navigation }: RootProps<'LoveNotes'>) {
  const { data, addNote, deleteNote, markNotesRead } = useApp();
  const { me, members } = useMe();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const notes = useMemo(
    () => [...data.notes].sort((a, b) => b.createdAt - a.createdAt),
    [data.notes],
  );

  useEffect(() => {
    markNotesRead();
  }, [markNotesRead]);

  const send = () => {
    if (!draft.trim()) return;
    addNote(draft);
    setDraft('');
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const confirmDelete = (id: string) =>
    Alert.alert('Delete this note?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(id) },
    ]);

  const nameOf = (authorId: string) =>
    members.find(m => m.id === authorId)?.name ?? 'Someone';

  return (
    <Screen>
      <Header
        title="Love Notes"
        subtitle={`${notes.length} note${notes.length === 1 ? '' : 's'} between you`}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {notes.length ? (
          <FlatList
            ref={listRef}
            data={notes}
            keyExtractor={n => n.id}
            inverted
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const mine = item.authorId === me?.id;
              return (
                <Pressable
                  onLongPress={() => confirmDelete(item.id)}
                  accessibilityRole="text"
                  accessibilityLabel={`${nameOf(item.authorId)}: ${item.text}`}
                  style={[s.bubbleWrap, mine ? s.bubbleRight : s.bubbleLeft]}>
                  <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                    <Text style={[s.text, mine ? s.textMine : s.textTheirs]}>{item.text}</Text>
                    <Text style={[s.stamp, mine ? s.stampMine : s.stampTheirs]}>
                      {mine ? '' : `${nameOf(item.authorId)} • `}
                      {fmtNoteStamp(item.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        ) : (
          <EmptyState
            icon="mail-outline"
            title="Say something only they will read"
            message="Love notes stay here, between the two of you. Write the first one below."
          />
        )}

        <View style={s.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a love note…"
            placeholderTextColor={colors.textFaint}
            style={s.input}
            multiline
            maxLength={500}
            selectionColor={colors.pink}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send note"
            style={[s.send, !draft.trim() && s.sendOff]}>
            <Icon name="send" size={17} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },

  bubbleWrap: { marginBottom: spacing.md, maxWidth: '82%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.blushDeep, borderBottomRightRadius: 5 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 5 },
  text: { ...type.body, lineHeight: 22 },
  textMine: { color: '#4A2A34' },
  textTheirs: { color: colors.textSoft },
  stamp: { ...type.caption, marginTop: 6, fontSize: 10 },
  stampMine: { color: '#8A6672' },
  stampTheirs: { color: colors.textFaint },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    color: colors.text,
    ...type.body,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { backgroundColor: colors.surfaceAlt },
});
