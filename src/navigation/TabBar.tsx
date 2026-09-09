/** The floating tab bar with the pink add button in the middle. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, gradients, radius, shadow, spacing, type } from '../theme';
import { Icon } from '../components/ui';

const ICONS: Record<string, { on: string; off: string; label: string }> = {
  Home: { on: 'home', off: 'home-outline', label: 'Home' },
  Moments: { on: 'albums', off: 'albums-outline', label: 'Memories' },
  Timeline: { on: 'git-commit', off: 'git-commit-outline', label: 'Timeline' },
  Us: { on: 'people', off: 'people-outline', label: 'Us' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const focused = state.index === index;
    const meta = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline', label: route.name };

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        style={s.tab}>
        <Icon
          name={focused ? meta.on : meta.off}
          size={21}
          color={focused ? colors.pink : colors.textFaint}
        />
        <Text style={[s.label, focused && s.labelActive]}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={s.side}>{left.map((route, i) => renderTab(route, i))}</View>

      <Pressable
        onPress={() => navigation.navigate('Import')}
        accessibilityRole="button"
        accessibilityLabel="Add a memory"
        style={({ pressed }) => [s.fabWrap, pressed && s.fabPressed]}>
        <LinearGradient
          colors={[...gradients.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.fab, shadow.fab]}>
          <Icon name="add" size={28} color={colors.white} />
        </LinearGradient>
      </Pressable>

      <View style={s.side}>{right.map((route, i) => renderTab(route, i + left.length))}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
  },
  side: { flex: 1, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: { ...type.caption, color: colors.textFaint, marginTop: 3, fontSize: 10 },
  labelActive: { color: colors.pink },

  fabWrap: { width: 74, alignItems: 'center', marginTop: -22 },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
  fab: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.bgElevated,
  },
});
