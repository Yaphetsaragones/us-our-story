/**
 * A bottom action sheet: icon, label and chevron per row, with the destructive
 * choice in red and Cancel set apart underneath.
 *
 * Replaces Alert.alert for choices, which renders as a bare system dialog —
 * no icons, no styling, and inconsistent button order between platforms.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '../theme';
import { Icon } from './ui';

export interface SheetAction {
  label: string;
  icon: string;
  onPress: () => void;
  /** Renders in red — for anything that removes or deletes. */
  destructive?: boolean;
  disabled?: boolean;
}

export function ActionSheet({
  visible,
  title,
  message,
  actions,
  onClose,
  cancelLabel = 'Cancel',
}: {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  onClose: () => void;
  cancelLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  // Run the action after the sheet is dismissed so the two animations don't fight.
  const choose = (action: SheetAction) => {
    if (action.disabled) return;
    onClose();
    requestAnimationFrame(action.onPress);
  };

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={s.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />

      <Animated.View
        style={[
          s.wrap,
          { paddingBottom: Math.max(insets.bottom, spacing.lg), transform: [{ translateY }] },
        ]}>
        <View style={s.sheet}>
          {title || message ? (
            <View style={s.header}>
              {title ? (
                <Text style={s.title} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {message ? <Text style={s.message}>{message}</Text> : null}
            </View>
          ) : null}

          <ScrollView bounces={false} style={s.list}>
            {actions.map((action, i) => (
              <Pressable
                key={action.label}
                onPress={() => choose(action)}
                disabled={action.disabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: !!action.disabled }}
                style={({ pressed }) => [
                  s.row,
                  i > 0 && s.rowDivider,
                  pressed && !action.disabled && s.rowPressed,
                  action.disabled && s.rowDisabled,
                ]}>
                <Icon
                  name={action.icon}
                  size={21}
                  color={action.destructive ? colors.danger : colors.textSoft}
                />
                <Text style={[s.label, action.destructive && s.labelDestructive]}>
                  {action.label}
                </Text>
                <Icon
                  name="chevron-forward"
                  size={16}
                  color={action.destructive ? colors.danger : colors.textFaint}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [s.cancel, pressed && s.cancelPressed]}>
          <Text style={s.cancelLabel}>{cancelLabel}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...type.h3, color: colors.text },
  message: { ...type.small, color: colors.textMuted, marginTop: 4, lineHeight: 19 },

  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 17,
    gap: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowDisabled: { opacity: 0.4 },
  label: {
    ...type.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  labelDestructive: { color: colors.danger },

  cancel: {
    marginTop: spacing.sm,
    paddingVertical: 17,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cancelPressed: { backgroundColor: colors.surfacePressed },
  cancelLabel: {
    ...type.body,
    color: colors.textSoft,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 13,
  },
});
