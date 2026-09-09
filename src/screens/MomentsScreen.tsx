import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';
import {
  Chip,
  EmptyState,
  Header,
  IconButton,
  Screen,
  SectionTitle,
  TabSpacer,
} from '../components/ui';
import { CollectionRow } from '../components/media';
import { PromptModal } from '../components/PromptModal';
import { useApp } from '../context/AppContext';
import { albumMemories, buildMoments, visibleMemories } from '../lib/select';
import { fmtRange } from '../lib/date';
import type { TabProps } from '../navigation/types';

type Filter = 'all' | 'photo' | 'video';

export function MomentsScreen({ navigation }: TabProps<'Moments'>) {
  const { data, createAlbum } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [naming, setNaming] = useState(false);

  const memories = useMemo(() => {
    const all = visibleMemories(data);
    if (filter === 'all') return all;
    return all.filter(m => m.kind === filter);
  }, [data, filter]);

  const albums = useMemo(
    () =>
      [...data.albums]
        .sort((a, b) => a.order - b.order)
        .map(album => ({
          album,
          items: albumMemories(album, memories, data.couple),
        })),
    [data.albums, memories, data.couple],
  );

  const moments = useMemo(
    () => buildMoments(memories, data.momentTitles),
    [memories, data.momentTitles],
  );

  const addAlbum = (title: string) => {
    const album = createAlbum(title);
    setNaming(false);
    navigation.navigate('Collection', { source: 'album', id: album.id, title: album.title });
  };

  const hasAnything = data.memories.length > 0;

  return (
    <Screen>
      <Header
        title="Our Moments"
        center={false}
        right={<IconButton name="add" onPress={() => setNaming(true)} label="New collection" />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.filters}>
          <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Photos" active={filter === 'photo'} onPress={() => setFilter('photo')} />
          <Chip label="Videos" active={filter === 'video'} onPress={() => setFilter('video')} />
        </View>

        {!hasAnything ? (
          <EmptyState
            icon="albums-outline"
            title="Collections build themselves"
            message="Import a few memories and your first date, your trips, your birthdays and your favorites all get gathered up automatically."
            actionLabel="Add memories"
            onAction={() => navigation.navigate('Import')}
          />
        ) : (
          <>
            <View style={s.section}>
              <SectionTitle title="Collections" />
              {albums.map(({ album, items }) => (
                <CollectionRow
                  key={album.id}
                  title={album.title}
                  count={items.length}
                  cover={items[0]}
                  icon={album.icon}
                  onPress={() =>
                    navigation.navigate('Collection', {
                      source: 'album',
                      id: album.id,
                      title: album.title,
                    })
                  }
                />
              ))}
            </View>

            <View style={s.section}>
              <SectionTitle title="By date" />
              <Text style={s.hint}>
                Every run of days you photographed together, grouped on its own.
              </Text>
              {moments.map(moment => (
                <CollectionRow
                  key={moment.id}
                  title={moment.title}
                  count={moment.memories.length}
                  cover={moment.memories[0]}
                  onPress={() =>
                    navigation.navigate('Collection', {
                      source: 'moment',
                      id: moment.id,
                      title: moment.title,
                    })
                  }
                />
              ))}
              {moments.length ? (
                <Text style={s.footnote}>
                  Oldest: {fmtRange(moments[moments.length - 1].startAt, moments[0].endAt)}
                </Text>
              ) : null}
            </View>
          </>
        )}

        <TabSpacer />
      </ScrollView>

      <PromptModal
        visible={naming}
        title="New collection"
        message="Sunset Moments, Late Night Drives, Our Silly Faces — anything you want to keep together."
        placeholder="Collection name"
        confirmLabel="Create"
        onCancel={() => setNaming(false)}
        onSubmit={addAlbum}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  filters: { flexDirection: 'row', marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  hint: { ...type.small, color: colors.textFaint, marginTop: -spacing.sm, marginBottom: spacing.md },
  footnote: { ...type.caption, color: colors.textFaint, textAlign: 'center', marginTop: spacing.sm },
});
