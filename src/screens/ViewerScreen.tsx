/** Full-screen swipe through a collection, with captions, places and actions. */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, gradients, radius, spacing, type } from '../theme';
import { Icon, IconButton } from '../components/ui';
import { useApp } from '../context/AppContext';
import { fmtDate, fmtTime } from '../lib/date';
import type { Memory } from '../types';
import type { RootProps } from '../navigation/types';

export function ViewerScreen({ navigation, route }: RootProps<'Viewer'>) {
  const { ids, index: startIndex, title } = route.params;
  const { data, toggleFavorite, toggleHidden, deleteMemory } = useApp();
  const { width, height } = useWindowDimensions();

  const memories = useMemo(
    () => ids.map(id => data.memories.find(m => m.id === id)).filter((m): m is Memory => !!m),
    [ids, data.memories],
  );

  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, memories.length - 1)));
  const [chromeVisible, setChromeVisible] = useState(true);
  const listRef = useRef<FlatList<Memory>>(null);

  const current = memories[index];

  // RN's ViewToken type moved between releases, so we describe just what we read.
  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const share = useCallback(() => {
    if (!current) return;
    Share.share({
      url: current.uri,
      message: current.caption ?? `A memory from ${fmtDate(current.takenAt)} ❤️`,
    }).catch(() => {});
  }, [current]);

  const remove = useCallback(() => {
    if (!current) return;
    Alert.alert('Remove this memory?', 'It leaves Us for good.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteMemory(current.id);
          if (memories.length <= 1) navigation.goBack();
        },
      },
    ]);
  }, [current, deleteMemory, memories.length, navigation]);

  const more = useCallback(() => {
    if (!current) return;
    Alert.alert(title ?? 'Memory', undefined, [
      {
        text: 'Edit caption, date & place',
        onPress: () => navigation.navigate('MemoryEdit', { id: current.id }),
      },
      {
        text: current.hidden ? 'Unhide this memory' : 'Hide this memory',
        onPress: () => toggleHidden(current.id),
      },
      { text: 'Remove from Us', style: 'destructive', onPress: remove },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [current, navigation, remove, title, toggleHidden]);

  if (!current) {
    return (
      <View style={s.container}>
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>This memory is gone.</Text>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={s.emptyLink}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar hidden={!chromeVisible} barStyle="light-content" />

      <FlatList
        ref={listRef}
        data={memories}
        keyExtractor={m => m.id}
        horizontal
        pagingEnabled
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        renderItem={({ item, index: i }) => (
          <Pressable
            style={{ width, height }}
            onPress={() => setChromeVisible(v => !v)}
            accessibilityRole="image"
            accessibilityLabel={item.caption ?? 'Memory'}>
            {item.kind === 'video' ? (
              <Video
                source={{ uri: item.uri }}
                style={absFill}
                resizeMode="contain"
                paused={i !== index}
                repeat
                controls={chromeVisible}
                ignoreSilentSwitch="ignore"
              />
            ) : (
              <Image source={{ uri: item.uri }} style={absFill} resizeMode="contain" />
            )}
          </Pressable>
        )}
      />

      {chromeVisible ? (
        <>
          <LinearGradient colors={[...gradients.scrimUp]} style={s.topScrim} pointerEvents="none" />
          <View style={s.top}>
            <IconButton
              name="chevron-back"
              onPress={() => navigation.goBack()}
              color={colors.white}
              label="Back"
            />
            <View style={s.topTitle}>
              <Text style={s.title} numberOfLines={1}>
                {title ?? 'Our Memories'}
              </Text>
              <Text style={s.counter}>
                {index + 1} of {memories.length}
              </Text>
            </View>
            <IconButton
              name="ellipsis-horizontal"
              onPress={more}
              color={colors.white}
              label="More options"
            />
          </View>

          <LinearGradient
            colors={[...gradients.scrimDown]}
            style={s.bottomScrim}
            pointerEvents="none"
          />
          <View style={s.bottom}>
            {memories.length > 1 ? (
              <FlatList
                data={memories}
                keyExtractor={m => `strip-${m.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.strip}
                renderItem={({ item, index: i }) => (
                  <Pressable
                    onPress={() => {
                      setIndex(i);
                      listRef.current?.scrollToIndex({ index: i, animated: true });
                    }}
                    accessibilityRole="button"
                    style={[s.stripItem, i === index && s.stripItemActive]}>
                    {item.kind === 'photo' ? (
                      <Image source={{ uri: item.uri }} style={s.stripThumb} />
                    ) : (
                      <View style={[s.stripThumb, s.stripVideo]}>
                        <Icon name="play" size={13} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                )}
              />
            ) : null}

            <View style={s.actions}>
              <Pressable
                onPress={() => toggleFavorite(current.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={current.favorite ? 'Remove favorite' : 'Add favorite'}
                style={s.action}>
                <Icon
                  name={current.favorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={current.favorite ? colors.pink : colors.white}
                />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('MemoryEdit', { id: current.id })}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Edit details"
                style={s.action}>
                <Icon name="create-outline" size={23} color={colors.white} />
              </Pressable>
              <Pressable
                onPress={share}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Share"
                style={s.action}>
                <Icon name="share-outline" size={23} color={colors.white} />
              </Pressable>
              <Pressable
                onPress={remove}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Remove"
                style={s.action}>
                <Icon name="trash-outline" size={22} color={colors.white} />
              </Pressable>
            </View>

            {current.caption ? (
              <Text style={s.caption}>{current.caption}</Text>
            ) : null}

            <View style={s.meta}>
              <Icon name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaText}>
                {fmtDate(current.takenAt)} • {fmtTime(current.takenAt)}
              </Text>
            </View>
            {current.location ? (
              <View style={s.meta}>
                <Icon name="location-outline" size={12} color={colors.pink} />
                <Text style={[s.metaText, s.metaPlace]}>{current.location}</Text>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...type.body, color: colors.textMuted },
  emptyLink: { ...type.body, color: colors.pink, marginTop: spacing.md, fontWeight: '600' },

  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  topTitle: { flex: 1, alignItems: 'center' },
  title: { ...type.title, color: colors.white },
  counter: { ...type.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  strip: { paddingVertical: spacing.md },
  stripItem: {
    marginRight: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  stripItemActive: { borderColor: colors.pink },
  stripThumb: { width: 46, height: 46, borderRadius: 5, backgroundColor: colors.surfaceAlt },
  stripVideo: { alignItems: 'center', justifyContent: 'center' },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  action: { padding: 2 },

  caption: {
    ...type.h3,
    color: colors.white,
    fontWeight: '400',
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  metaText: { ...type.small, color: colors.textMuted, marginLeft: 6 },
  metaPlace: { color: colors.pinkSoft },
});
