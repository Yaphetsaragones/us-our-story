/** Thumbnails, grid tiles and the cards that show a clustered moment. */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, shadow, spacing, type } from '../theme';
import { fmtDuration, fmtRange } from '../lib/date';
import type { Memory, Moment } from '../types';
import { Icon } from './ui';

/**
 * Photos render directly. Videos get a play badge instead of a frame grab —
 * pulling a poster frame needs a native thumbnailer we deliberately don't
 * bundle, and the badge keeps big grids scrolling smoothly.
 */
export function MediaThumb({
  memory,
  style,
  radius: r = radius.md,
  showBadges = true,
}: {
  memory: Memory;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  showBadges?: boolean;
}) {
  const isVideo = memory.kind === 'video';

  return (
    <View style={[st.thumb, { borderRadius: r }, style]}>
      {isVideo ? (
        <LinearGradient colors={[...gradients.dusk]} style={st.fill}>
          <View style={st.playCircle}>
            <Icon name="play" size={18} color={colors.white} />
          </View>
        </LinearGradient>
      ) : (
        <Image source={{ uri: memory.uri }} style={st.fill} resizeMode="cover" />
      )}

      {showBadges && isVideo && memory.durationMs ? (
        <View style={st.durationBadge}>
          <Text style={st.durationText}>{fmtDuration(memory.durationMs)}</Text>
        </View>
      ) : null}

      {showBadges && memory.favorite ? (
        <View style={st.favBadge}>
          <Icon name="heart" size={11} color={colors.white} />
        </View>
      ) : null}

      {showBadges && memory.hidden ? (
        <View style={st.hiddenBadge}>
          <Icon name="eye-off" size={11} color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

export function MemoryTile({
  memory,
  size,
  onPress,
  onLongPress,
  selected,
}: {
  memory: Memory;
  size: number;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="imagebutton"
      accessibilityLabel={memory.caption ?? 'Memory'}
      style={({ pressed }) => [{ width: size, height: size }, st.tile, pressed && st.pressed]}>
      <MediaThumb memory={memory} style={st.fill} radius={radius.sm} />
      {selected ? (
        <View style={st.selectedOverlay}>
          <View style={st.selectedDot}>
            <Icon name="checkmark" size={14} color={colors.white} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

/** The wide card on Home: cover image, title, counts and place. */
export function MomentCard({
  moment,
  onPress,
  width,
}: {
  moment: Moment;
  onPress: () => void;
  width: number;
}) {
  const cover = moment.memories.find(m => m.kind === 'photo') ?? moment.memories[0];
  const parts = [
    moment.photoCount ? `${moment.photoCount} photo${moment.photoCount > 1 ? 's' : ''}` : null,
    moment.videoCount ? `${moment.videoCount} video${moment.videoCount > 1 ? 's' : ''}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ width }, st.momentCard, pressed && st.pressed]}>
      <View style={st.momentCover}>
        {cover ? <MediaThumb memory={cover} style={st.fill} radius={radius.lg} showBadges={false} /> : null}
        <LinearGradient colors={[...gradients.scrimDown]} style={st.momentScrim} />
        {moment.videoCount > 0 ? (
          <View style={st.momentVideoBadge}>
            <Icon name="videocam" size={12} color={colors.white} />
            <Text style={st.momentVideoText}>{moment.videoCount}</Text>
          </View>
        ) : null}
      </View>

      <Text style={st.momentTitle} numberOfLines={1}>
        {moment.title}
      </Text>
      <Text style={st.momentMeta} numberOfLines={1}>
        {fmtRange(moment.startAt, moment.endAt)}
      </Text>
      <Text style={st.momentMeta} numberOfLines={1}>
        {parts.join(' • ')}
      </Text>
      {moment.location ? (
        <View style={st.momentPlace}>
          <Icon name="location-outline" size={11} color={colors.pink} />
          <Text style={st.momentPlaceText} numberOfLines={1}>
            {moment.location}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** A row in Our Moments: square cover, title, item count. */
export function CollectionRow({
  title,
  count,
  cover,
  icon,
  onPress,
}: {
  title: string;
  count: number;
  cover?: Memory;
  icon?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [st.collectionRow, pressed && st.rowPressed]}>
      <View style={st.collectionCover}>
        {cover ? (
          <MediaThumb memory={cover} style={st.fill} radius={radius.md} showBadges={false} />
        ) : (
          <View style={[st.fill, st.collectionEmpty]}>
            <Icon name={icon ?? 'images-outline'} size={20} color={colors.textFaint} />
          </View>
        )}
      </View>
      <View style={st.collectionBody}>
        <Text style={st.collectionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={st.collectionCount}>
          {count} item{count === 1 ? '' : 's'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  fill: { width: '100%', height: '100%' },

  thumb: { overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 34,
    height: 34,
    marginTop: -17,
    marginLeft: -17,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.overlay,
  },
  durationText: { ...type.caption, color: colors.white, fontSize: 10 },
  favBadge: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenBadge: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tile: { borderRadius: radius.sm, overflow: 'hidden' },
  pressed: { opacity: 0.8 },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(233,140,163,0.35)',
    borderWidth: 2,
    borderColor: colors.pink,
    borderRadius: radius.sm,
    alignItems: 'flex-end',
    padding: 4,
  },
  selectedDot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  momentCard: { marginRight: spacing.md },
  momentCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  momentScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  momentVideoBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  momentVideoText: { ...type.caption, color: colors.white, marginLeft: 3 },
  momentTitle: { ...type.body, fontWeight: '600', color: colors.text },
  momentMeta: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  momentPlace: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  momentPlaceText: { ...type.caption, color: colors.pink, marginLeft: 3, flex: 1 },

  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  collectionCover: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  collectionEmpty: { alignItems: 'center', justifyContent: 'center' },
  collectionBody: { flex: 1 },
  collectionTitle: { ...type.body, fontWeight: '600', color: colors.text },
  collectionCount: { ...type.small, color: colors.textMuted, marginTop: 3 },
});
