/** Search across captions, places, collection names and dates. */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { EmptyState, Icon, Screen } from '../components/ui';
import { MemoryTile } from '../components/media';
import { useApp } from '../context/AppContext';
import { albumMemories, buildMoments, visibleMemories } from '../lib/select';
import { fmtDate } from '../lib/date';
import type { Memory } from '../types';
import type { RootProps } from '../navigation/types';

const GAP = 3;
const COLUMNS = 3;

export function SearchScreen({ navigation }: RootProps<'Search'>) {
  const { data } = useApp();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const memories = useMemo(() => visibleMemories(data), [data]);
  const term = query.trim().toLowerCase();

  /**
   * A memory matches on its own caption or place, on the title of the moment
   * it belongs to, or on its date written out — so "august", "2026" and
   * "palawan" all find something.
   */
  const results = useMemo(() => {
    if (term.length < 2) return [];
    const moments = buildMoments(memories, data.momentTitles);
    const titleFor = new Map<string, string>();
    moments.forEach(m => m.memories.forEach(x => titleFor.set(x.id, m.title)));

    return memories.filter(m => {
      const haystack = [
        m.caption,
        m.location,
        titleFor.get(m.id),
        fmtDate(m.takenAt),
        m.kind === 'video' ? 'video' : 'photo',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [memories, data.momentTitles, term]);

  /** Places and collections worth offering before anything is typed. */
  const suggestions = useMemo(() => {
    const places = Array.from(
      new Set(memories.map(m => m.location).filter(Boolean) as string[]),
    ).slice(0, 6);
    const albums = data.albums
      .map(a => ({ album: a, count: albumMemories(a, memories, data.couple).length }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { places, albums };
  }, [memories, data.albums, data.couple]);

  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const showResults = term.length >= 2;

  const open = (index: number) =>
    navigation.navigate('Viewer', {
      ids: results.map(m => m.id),
      index,
      title: `"${query.trim()}"`,
    });

  return (
    <Screen>
      <View style={s.bar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={s.back}>
          <Icon name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={s.field}>
          <Icon name="search-outline" size={17} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Captions, places, dates…"
            placeholderTextColor={colors.textFaint}
            style={s.input}
            autoFocus
            returnKeyType="search"
            selectionColor={colors.pink}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Icon name="close-circle" size={17} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showResults ? (
        results.length ? (
          <FlatList
            data={results}
            keyExtractor={m => m.id}
            numColumns={COLUMNS}
            columnWrapperStyle={s.row}
            contentContainerStyle={s.grid}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text style={s.count}>
                {results.length} result{results.length === 1 ? '' : 's'} for "{query.trim()}"
              </Text>
            }
            renderItem={({ item, index }: { item: Memory; index: number }) => (
              <MemoryTile memory={item} size={tileSize} onPress={() => open(index)} />
            )}
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Nothing found"
            message={`No memory matches "${query.trim()}". Try a place, a month, or a word from a caption.`}
          />
        )
      ) : (
        <View style={s.suggestions}>
          {suggestions.places.length ? (
            <>
              <Text style={s.sectionLabel}>PLACES</Text>
              <View style={s.chips}>
                {suggestions.places.map(place => (
                  <Pressable
                    key={place}
                    onPress={() => setQuery(place)}
                    accessibilityRole="button"
                    style={({ pressed }) => [s.chip, pressed && s.chipPressed]}>
                    <Icon name="location-outline" size={13} color={colors.pink} />
                    <Text style={s.chipText}>{place}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {suggestions.albums.length ? (
            <>
              <Text style={[s.sectionLabel, s.sectionSpaced]}>COLLECTIONS</Text>
              {suggestions.albums.map(({ album, count }) => (
                <Pressable
                  key={album.id}
                  onPress={() =>
                    navigation.navigate('Collection', {
                      source: 'album',
                      id: album.id,
                      title: album.title,
                    })
                  }
                  accessibilityRole="button"
                  style={({ pressed }) => [s.albumRow, pressed && s.chipPressed]}>
                  <Icon name={album.icon} size={17} color={colors.pink} />
                  <Text style={s.albumTitle}>{album.title}</Text>
                  <Text style={s.albumCount}>{count}</Text>
                  <Icon name="chevron-forward" size={14} color={colors.textFaint} />
                </Pressable>
              ))}
            </>
          ) : null}

          {!suggestions.places.length && !suggestions.albums.length ? (
            <EmptyState
              icon="search-outline"
              title="Nothing to search yet"
              message="Once you have memories with captions and places, you can find them from here."
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  back: { padding: 6 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  input: { flex: 1, color: colors.text, paddingVertical: 11, ...type.body },

  grid: { paddingBottom: spacing.xxxl },
  row: { gap: GAP, marginBottom: GAP },
  count: {
    ...type.small,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  suggestions: { paddingHorizontal: spacing.lg },
  sectionLabel: {
    ...type.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  sectionSpaced: { marginTop: spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    gap: 5,
  },
  chipPressed: { backgroundColor: colors.surfacePressed },
  chipText: { ...type.small, color: colors.textSoft },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  albumTitle: { ...type.body, color: colors.text, flex: 1 },
  albumCount: { ...type.small, color: colors.textMuted },
});
