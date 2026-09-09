/**
 * The year movie. Rather than encode an MP4 on-device, this plays the reel:
 * a cross-faded, slowly zooming slideshow of the year's highlights with the
 * videos playing inline. What you see is what a rendered movie would show.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { absFill, colors, gradients, radius, spacing, type } from '../theme';
import { Icon, IconButton, ScriptTitle } from '../components/ui';
import { useApp } from '../context/AppContext';
import { reelSelection, yearStats } from '../lib/select';
import { fmtDate } from '../lib/date';
import type { Memory } from '../types';
import type { RootProps } from '../navigation/types';

type Slide =
  | { kind: 'title' }
  | { kind: 'memory'; memory: Memory }
  | { kind: 'end' };

const FADE_MS = 700;
const TITLE_MS = 3400;
const MAX_VIDEO_MS = 6000;

export function YearMovieScreen({ navigation, route }: RootProps<'YearMovie'>) {
  const { year } = route.params;
  const { data } = useApp();
  const { width, height } = useWindowDimensions();

  const stats = useMemo(() => yearStats(data, year), [data, year]);
  const slides = useMemo<Slide[]>(
    () => [
      { kind: 'title' },
      ...reelSelection(stats).map<Slide>(memory => ({ kind: 'memory', memory })),
      { kind: 'end' },
    ],
    [stats],
  );

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [chrome, setChrome] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  const bar = useRef(new Animated.Value(0)).current;

  const slide = slides[index];
  const previous = index > 0 ? slides[index - 1] : undefined;

  const slideMs = useMemo(() => {
    if (!slide) return TITLE_MS;
    if (slide.kind !== 'memory') return TITLE_MS;
    if (slide.memory.kind === 'video') {
      return Math.min(slide.memory.durationMs ?? MAX_VIDEO_MS, MAX_VIDEO_MS);
    }
    return Math.round(data.settings.slideshowSeconds * 1000);
  }, [slide, data.settings.slideshowSeconds]);

  const advance = useCallback(() => {
    setIndex(i => (i < slides.length - 1 ? i + 1 : i));
  }, [slides.length]);

  // Each slide: fade the new frame in, drift the zoom, run the progress bar.
  useEffect(() => {
    fade.setValue(0);
    zoom.setValue(1);
    bar.setValue(0);

    const fadeIn = Animated.timing(fade, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    const drift = Animated.timing(zoom, {
      toValue: 1.12,
      duration: slideMs + FADE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    fadeIn.start();
    drift.start();

    return () => {
      fadeIn.stop();
      drift.stop();
    };
  }, [index, slideMs, fade, zoom, bar]);

  useEffect(() => {
    if (!playing) {
      bar.stopAnimation();
      return;
    }
    const progress = Animated.timing(bar, {
      toValue: 1,
      duration: slideMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progress.start();

    const timer = setTimeout(advance, slideMs);
    return () => {
      progress.stop();
      clearTimeout(timer);
    };
  }, [index, playing, slideMs, advance, bar]);

  const atEnd = slide?.kind === 'end';

  useEffect(() => {
    if (atEnd) setPlaying(false);
  }, [atEnd]);

  const replay = () => {
    setIndex(0);
    setPlaying(true);
  };

  const renderFrame = (item: Slide | undefined, animated: boolean) => {
    if (!item) return null;

    if (item.kind === 'title') {
      return (
        <LinearGradient colors={[...gradients.dusk]} style={absFill}>
          <View style={s.center}>
            <ScriptTitle text="Us" size={54} />
            <Text style={s.titleKicker}>OUR YEAR</Text>
            <Text style={s.titleYear}>{year}</Text>
            <View style={s.titleStats}>
              <Text style={s.titleStat}>{stats.photos.toLocaleString()} photos</Text>
              <Text style={s.titleStat}>{stats.videos.toLocaleString()} videos</Text>
              <Text style={s.titleStat}>{stats.moments} special moments</Text>
              <Text style={s.titleStat}>{stats.daysTogether.toLocaleString()} days together</Text>
            </View>
          </View>
        </LinearGradient>
      );
    }

    if (item.kind === 'end') {
      return (
        <LinearGradient colors={[...gradients.sunset]} style={absFill}>
          <View style={s.center}>
            <Icon name="heart" size={34} color={colors.white} />
            <Text style={s.endLine}>More than just photos and videos…</Text>
            <ScriptTitle text="It's your love story." size={30} />
            <Pressable onPress={replay} style={s.replay} accessibilityRole="button">
              <Icon name="refresh" size={17} color={colors.white} />
              <Text style={s.replayText}>Watch again</Text>
            </Pressable>
          </View>
        </LinearGradient>
      );
    }

    const { memory } = item;
    if (memory.kind === 'video') {
      return (
        <Video
          source={{ uri: memory.uri }}
          style={absFill}
          resizeMode="cover"
          paused={!playing || !animated}
          muted
          repeat
        />
      );
    }

    return (
      <Animated.Image
        source={{ uri: memory.uri }}
        style={[
          absFill,
          { width, height },
          animated ? { transform: [{ scale: zoom }] } : null,
        ]}
        resizeMode="cover"
      />
    );
  };

  return (
    <View style={s.container}>
      <StatusBar hidden />

      <Pressable style={s.flex} onPress={() => setChrome(c => !c)} accessibilityRole="button">
        {/* Outgoing frame stays put while the new one fades over it. */}
        <View style={absFill}>{renderFrame(previous, false)}</View>
        <Animated.View style={[absFill, { opacity: fade }]}>
          {renderFrame(slide, true)}
        </Animated.View>

        {slide?.kind === 'memory' ? (
          <>
            <LinearGradient
              colors={[...gradients.scrimDown]}
              style={s.captionScrim}
              pointerEvents="none"
            />
            <View style={s.captionWrap} pointerEvents="none">
              {slide.memory.caption ? (
                <Text style={s.caption}>{slide.memory.caption}</Text>
              ) : null}
              <View style={s.metaRow}>
                <Text style={s.meta}>{fmtDate(slide.memory.takenAt)}</Text>
                {slide.memory.location ? (
                  <>
                    <Text style={s.metaDot}>•</Text>
                    <Icon name="location" size={11} color={colors.pinkSoft} />
                    <Text style={[s.meta, s.metaPlace]}>{slide.memory.location}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </>
        ) : null}
      </Pressable>

      {/* Progress */}
      <View style={s.progressWrap} pointerEvents="none">
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={s.progressCount}>
          {index + 1} / {slides.length}
        </Text>
      </View>

      {chrome || !playing ? (
        <View style={s.controls}>
          <IconButton
            name="close"
            onPress={() => navigation.goBack()}
            color={colors.white}
            label="Close"
          />
          <Pressable
            onPress={() => (atEnd ? replay() : setPlaying(p => !p))}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            style={s.playBtn}>
            <Icon
              name={atEnd ? 'refresh' : playing ? 'pause' : 'play'}
              size={24}
              color={colors.white}
            />
          </Pressable>
          <IconButton
            name="play-skip-forward"
            onPress={advance}
            color={colors.white}
            label="Next"
          />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  titleKicker: {
    ...type.caption,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 5,
    marginTop: spacing.md,
  },
  titleYear: { fontSize: 72, lineHeight: 82, fontWeight: '700', color: colors.white },
  titleStats: { alignItems: 'center', marginTop: spacing.xl },
  titleStat: { ...type.body, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  endLine: { ...type.body, color: colors.white, marginTop: spacing.lg, marginBottom: spacing.sm },
  replay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  replayText: { ...type.body, color: colors.white, marginLeft: spacing.sm, fontWeight: '600' },

  captionScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  captionWrap: { position: 'absolute', left: 0, right: 0, bottom: 92, paddingHorizontal: spacing.xl },
  caption: {
    ...type.h3,
    color: colors.white,
    fontWeight: '400',
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { ...type.small, color: 'rgba(255,255,255,0.75)' },
  metaDot: { ...type.small, color: 'rgba(255,255,255,0.5)', marginHorizontal: 6 },
  metaPlace: { color: colors.pinkSoft, marginLeft: 4 },

  progressWrap: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.pink },
  progressCount: { ...type.caption, color: 'rgba(255,255,255,0.7)', marginLeft: spacing.md },

  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  playBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
