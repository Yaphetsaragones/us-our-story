import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { Field, Header, Icon, PrimaryButton, Screen, Toggle } from '../components/ui';
import { DateField } from '../components/DateField';
import { MediaThumb } from '../components/media';
import { useApp } from '../context/AppContext';
import { albumMemories } from '../lib/select';
import type { RootProps } from '../navigation/types';

export function MemoryEditScreen({ navigation, route }: RootProps<'MemoryEdit'>) {
  const { data, updateMemory } = useApp();
  const memory = data.memories.find(m => m.id === route.params.id);

  const [caption, setCaption] = useState(memory?.caption ?? '');
  const [location, setLocation] = useState(memory?.location ?? '');
  const [takenAt, setTakenAt] = useState(memory?.takenAt ?? Date.now());
  const [favorite, setFavorite] = useState(memory?.favorite ?? false);
  const [hidden, setHidden] = useState(memory?.hidden ?? false);
  const [albumIds, setAlbumIds] = useState<string[]>(memory?.albumIds ?? []);

  if (!memory) {
    return (
      <Screen>
        <Header title="Memory" onBack={() => navigation.goBack()} />
        <Text style={s.missing}>This memory is no longer here.</Text>
      </Screen>
    );
  }

  const save = () => {
    updateMemory(memory.id, {
      caption: caption.trim() || undefined,
      location: location.trim() || undefined,
      takenAt,
      favorite,
      hidden,
      albumIds,
    });
    navigation.goBack();
  };

  const toggleAlbum = (id: string) =>
    setAlbumIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  // Only collections you file by hand are togglable; the rest fill themselves.
  const manualAlbums = data.albums.filter(
    a => a.rule.type === 'manual' || a.rule.type === 'anniversary' || a.rule.type === 'birthdays',
  );

  return (
    <Screen>
      <Header title="Edit memory" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={s.preview}>
            {memory.kind === 'photo' ? (
              <Image source={{ uri: memory.uri }} style={s.previewMedia} resizeMode="cover" />
            ) : (
              <MediaThumb memory={memory} style={s.previewMedia} radius={radius.lg} />
            )}
          </View>

          <Field
            label="CAPTION"
            value={caption}
            onChangeText={setCaption}
            placeholder="Same place, same smiles, just more love now."
            multiline
            maxLength={280}
          />
          <Field
            label="LOCATION"
            value={location}
            onChangeText={setLocation}
            placeholder="Bali, Indonesia"
            maxLength={80}
            autoCapitalize="words"
          />
          <DateField label="DATE" value={takenAt} onChange={setTakenAt} />

          <View style={s.switchRow}>
            <Icon name="star-outline" size={19} color={colors.pink} />
            <View style={s.switchBody}>
              <Text style={s.switchTitle}>Favorite</Text>
              <Text style={s.switchHint}>Favorites lead your year movie.</Text>
            </View>
            <Toggle value={favorite} onChange={setFavorite} />
          </View>

          <View style={s.switchRow}>
            <Icon name="eye-off-outline" size={19} color={colors.pink} />
            <View style={s.switchBody}>
              <Text style={s.switchTitle}>Hide this memory</Text>
              <Text style={s.switchHint}>Kept, but out of every browse screen.</Text>
            </View>
            <Toggle value={hidden} onChange={setHidden} />
          </View>

          {manualAlbums.length ? (
            <>
              <Text style={s.sectionLabel}>COLLECTIONS</Text>
              <View style={s.albums}>
                {manualAlbums.map(album => {
                  const on = albumIds.includes(album.id);
                  const autoCount = albumMemories(album, [memory], data.couple).length > 0;
                  return (
                    <Pressable
                      key={album.id}
                      onPress={() => toggleAlbum(album.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[s.albumChip, on && s.albumChipOn]}>
                      <Icon
                        name={on ? 'checkmark-circle' : album.icon}
                        size={15}
                        color={on ? colors.white : colors.textMuted}
                      />
                      <Text style={[s.albumChipText, on && s.albumChipTextOn]}>
                        {album.title}
                      </Text>
                      {!on && autoCount ? <Text style={s.albumAuto}>auto</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
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
  missing: { ...type.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },

  preview: { marginBottom: spacing.xl },
  previewMedia: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  switchBody: { flex: 1, marginLeft: spacing.md },
  switchTitle: { ...type.body, color: colors.text },
  switchHint: { ...type.caption, color: colors.textMuted, marginTop: 2 },

  sectionLabel: {
    ...type.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  albums: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  albumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  albumChipOn: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  albumChipText: { ...type.small, color: colors.textMuted, marginLeft: 6 },
  albumChipTextOn: { color: colors.white, fontWeight: '600' },
  albumAuto: { ...type.caption, color: colors.pink, marginLeft: 6, fontSize: 9 },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
