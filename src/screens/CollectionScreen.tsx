import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors, spacing, type } from '../theme';
import { EmptyState, Header, IconButton, Screen } from '../components/ui';
import { PromptModal } from '../components/PromptModal';
import { MemoryTile } from '../components/media';
import { useApp } from '../context/AppContext';
import { albumMemories, buildMoments, memoriesOnThisDay, visibleMemories } from '../lib/select';
import { fmtRange } from '../lib/date';
import type { Memory } from '../types';
import type { RootProps } from '../navigation/types';

const GAP = 3;
const COLUMNS = 3;

export function CollectionScreen({ navigation, route }: RootProps<'Collection'>) {
  const { source, id, title } = route.params;
  const { data, setMomentTitle, renameAlbum, deleteAlbum, updateMemories, deleteMemory } = useApp();
  const { width } = useWindowDimensions();

  const [selection, setSelection] = useState<string[]>([]);
  const [renaming, setRenaming] = useState(false);

  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const album = source === 'album' ? data.albums.find(a => a.id === id) : undefined;

  const { items, heading, subheading } = useMemo(() => {
    const all = visibleMemories(data);

    if (source === 'album' && album) {
      const list = albumMemories(album, all, data.couple);
      return { items: list, heading: album.title, subheading: describe(list) };
    }
    if (source === 'moment') {
      const moment = buildMoments(all, data.momentTitles).find(m => m.id === id);
      return {
        items: moment?.memories.slice().reverse() ?? [],
        heading: moment?.title ?? 'Moment',
        subheading: moment
          ? `${fmtRange(moment.startAt, moment.endAt)} • ${describe(moment.memories)}`
          : '',
      };
    }
    if (source === 'favorites') {
      const list = all.filter(m => m.favorite);
      return { items: list, heading: 'Our Favorites', subheading: describe(list) };
    }
    if (source === 'onThisDay') {
      const list = memoriesOnThisDay(all);
      return { items: list, heading: 'On This Day', subheading: describe(list) };
    }
    if (source === 'hidden') {
      const list = data.memories.filter(m => m.hidden);
      return { items: list, heading: 'Hidden Memories', subheading: describe(list) };
    }
    return { items: all, heading: title ?? 'All Memories', subheading: describe(all) };
  }, [data, source, id, album, title]);

  const selecting = selection.length > 0;

  const toggleSelect = (memoryId: string) =>
    setSelection(prev =>
      prev.includes(memoryId) ? prev.filter(x => x !== memoryId) : [...prev, memoryId],
    );

  const open = (index: number) => {
    if (selecting) {
      toggleSelect(items[index].id);
      return;
    }
    navigation.navigate('Viewer', {
      ids: items.map(m => m.id),
      index,
      title: heading,
    });
  };

  const bulkFavorite = () => {
    updateMemories(selection, { favorite: true });
    setSelection([]);
  };

  const bulkHide = () => {
    updateMemories(selection, { hidden: true });
    setSelection([]);
  };

  const bulkDelete = () => {
    Alert.alert(
      `Remove ${selection.length} memor${selection.length === 1 ? 'y' : 'ies'}?`,
      'They leave Us for good. Copies in your phone gallery are untouched.',
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            for (const memoryId of selection) await deleteMemory(memoryId);
            setSelection([]);
          },
        },
      ],
    );
  };

  const rename = (value: string) => {
    if (source === 'moment' && id) setMomentTitle(id, value);
    if (source === 'album' && id) renameAlbum(id, value);
    setRenaming(false);
  };

  const removeAlbum = () => {
    if (!album || album.system) return;
    Alert.alert('Delete collection?', 'The memories inside stay in Us.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAlbum(album.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const canRename = source === 'moment' || (source === 'album' && !!album);

  return (
    <Screen>
      <Header
        title={selecting ? `${selection.length} selected` : heading}
        subtitle={selecting ? undefined : subheading}
        onBack={() => (selecting ? setSelection([]) : navigation.goBack())}
        right={
          selecting ? (
            <IconButton name="trash-outline" onPress={bulkDelete} label="Remove selected" />
          ) : canRename ? (
            <IconButton name="create-outline" onPress={() => setRenaming(true)} label="Rename" />
          ) : undefined
        }
      />

      {items.length ? (
        <FlatList
          data={items}
          keyExtractor={m => m.id}
          numColumns={COLUMNS}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          initialNumToRender={24}
          windowSize={7}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <MemoryTile
              memory={item}
              size={tileSize}
              selected={selection.includes(item.id)}
              onPress={() => open(index)}
              onLongPress={() => toggleSelect(item.id)}
            />
          )}
        />
      ) : (
        <EmptyState
          icon="images-outline"
          title="Nothing here yet"
          message={
            source === 'album' && album && !album.system
              ? 'Long-press any memory to add it to this collection.'
              : 'This collection fills itself as you add memories.'
          }
          actionLabel="Add memories"
          onAction={() => navigation.navigate('Import', album ? { albumId: album.id } : undefined)}
        />
      )}

      {selecting ? (
        <View style={s.bar}>
          <BarAction icon="heart" label="Favorite" onPress={bulkFavorite} />
          <BarAction icon="eye-off-outline" label="Hide" onPress={bulkHide} />
          <BarAction
            icon="checkmark-done"
            label="Select all"
            onPress={() => setSelection(items.map(m => m.id))}
          />
        </View>
      ) : null}

      {album && !album.system && !selecting ? (
        <View style={s.bar}>
          <BarAction
            icon="add"
            label="Add to this"
            onPress={() => navigation.navigate('Import', { albumId: album.id })}
          />
          <BarAction icon="trash-outline" label="Delete" onPress={removeAlbum} tone="danger" />
        </View>
      ) : null}

      <PromptModal
        visible={renaming}
        title="Rename"
        placeholder="Our Trip to Palawan"
        initialValue={heading}
        onCancel={() => setRenaming(false)}
        onSubmit={rename}
      />
    </Screen>
  );
}

function BarAction({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: string;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const tint = tone === 'danger' ? colors.danger : colors.pink;
  return (
    <View style={s.barItem}>
      <IconButton name={icon} onPress={onPress} color={tint} label={label} />
      <Text style={[s.barLabel, { color: tint }]}>{label}</Text>
    </View>
  );
}

function describe(list: Memory[]): string {
  const photos = list.filter(m => m.kind === 'photo').length;
  const videos = list.length - photos;
  const parts = [];
  if (photos) parts.push(`${photos} photo${photos === 1 ? '' : 's'}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
  return parts.join(' • ') || 'Empty';
}

const s = StyleSheet.create({
  grid: { paddingBottom: spacing.xxxl },
  row: { gap: GAP, marginBottom: GAP },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  barItem: { alignItems: 'center' },
  barLabel: { ...type.caption, marginTop: -2 },
});
