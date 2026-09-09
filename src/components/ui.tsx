/** Shared building blocks: screens, headers, buttons, fields, empty states. */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, fonts, gradients, radius, shadow, spacing, type } from '../theme';

// ---------------------------------------------------------------- primitives

export function Icon({
  name,
  size = 20,
  color = colors.text,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

export function Screen({
  children,
  style,
  edges = ['top'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView style={[s.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/** Header with an optional back chevron and one trailing action. */
export function Header({
  title,
  subtitle,
  onBack,
  right,
  center = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerSide}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <View style={[s.headerCenter, !center && s.headerLeft]}>
        <Text style={s.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[s.headerSide, s.headerSideRight]}>{right}</View>
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color = colors.text,
  label,
}: {
  name: string;
  onPress: () => void;
  size?: number;
  color?: string;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label ?? name}
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}>
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ buttons

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      style={({ pressed }) => [style, pressed && !inactive && s.pressedScale]}>
      <LinearGradient
        colors={inactive ? [colors.surfaceAlt, colors.surfaceAlt] : [...gradients.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.primaryBtn, shadow.fab]}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            {icon ? (
              <Icon
                name={icon}
                size={18}
                color={inactive ? colors.textFaint : colors.white}
                style={s.btnIcon}
              />
            ) : null}
            <Text style={[s.primaryBtnText, inactive && s.disabledText]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  icon,
  style,
  tone = 'default',
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'danger';
}) {
  const tint = tone === 'danger' ? colors.danger : colors.textSoft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.ghostBtn, style, pressed && s.pressed]}>
      {icon ? <Icon name={icon} size={18} color={tint} style={s.btnIcon} /> : null}
      <Text style={[s.ghostBtnText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

/** The dark rounded rows used across Import, Us and Privacy. */
export function TileButton({
  icon,
  title,
  subtitle,
  onPress,
  style,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.tile, style, pressed && s.tilePressed]}>
      <View style={s.tileIcon}>
        <Icon name={icon} size={22} color={colors.textSoft} />
      </View>
      <Text style={s.tileTitle}>{title}</Text>
      {subtitle ? <Text style={s.tileSubtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  onPress,
  right,
  tone = 'default',
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const tint = tone === 'danger' ? colors.danger : colors.text;
  const body = (
    <>
      {icon ? (
        <View style={s.rowIcon}>
          <Icon name={icon} size={18} color={tone === 'danger' ? colors.danger : colors.pink} />
        </View>
      ) : null}
      <View style={s.rowBody}>
        <Text style={[s.rowTitle, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-forward" size={16} color={colors.textFaint} /> : null)}
    </>
  );

  if (!onPress) return <View style={s.row}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
      {body}
    </Pressable>
  );
}

// ------------------------------------------------------------------- inputs

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
  autoFocus,
  autoCapitalize = 'sentences',
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={[s.field, multiline && s.fieldMultiline]}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        selectionColor={colors.pink}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [s.chip, active && s.chipActive, pressed && s.pressed]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[s.toggle, value && s.toggleOn]}>
      <View style={[s.toggleKnob, value && s.toggleKnobOn]} />
    </Pressable>
  );
}

// -------------------------------------------------------------------- misc

export function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionTitle}>
      <Text style={s.sectionTitleText}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <View style={s.sectionAction}>
            <Text style={s.sectionActionText}>{actionLabel}</Text>
            <Icon name="chevron-forward" size={13} color={colors.pink} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={30} color={colors.pink} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={s.emptyBtn} />
      ) : null}
    </View>
  );
}

export function Loading({ message }: { message?: string }) {
  return (
    <View style={s.loading}>
      <ActivityIndicator color={colors.pink} size="large" />
      {message ? <Text style={s.loadingText}>{message}</Text> : null}
    </View>
  );
}

export function ScriptTitle({ text, size = 56 }: { text: string; size?: number }) {
  return (
    <Text
      style={[s.script, { fontSize: size, lineHeight: size * 1.25 }]}
      allowFontScaling={false}>
      {text}
    </Text>
  );
}

/** Adds breathing room so content clears the floating tab bar. */
export function TabSpacer() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: 78 + insets.bottom }} />;
}

export { ScrollView };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  headerSideRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLeft: { alignItems: 'flex-start', paddingLeft: spacing.xs },
  headerTitle: { ...type.h3, color: colors.text },
  headerSubtitle: { ...type.caption, color: colors.textMuted, marginTop: 2 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55 },
  pressedScale: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  primaryBtnText: { ...type.title, color: colors.white, letterSpacing: 0.2 },
  disabledText: { color: colors.textFaint },
  btnIcon: { marginRight: spacing.sm },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: { ...type.body, fontWeight: '600' },

  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    minHeight: 108,
    justifyContent: 'center',
  },
  tilePressed: { backgroundColor: colors.surfacePressed },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileTitle: { ...type.title, color: colors.text },
  tileSubtitle: { ...type.small, color: colors.textMuted, marginTop: 3 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowBody: { flex: 1 },
  rowTitle: { ...type.body, fontWeight: '600' },
  rowSubtitle: { ...type.small, color: colors.textMuted, marginTop: 2 },

  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm },
  field: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    color: colors.text,
    ...type.body,
  },
  fieldMultiline: { minHeight: 92, textAlignVertical: 'top' },

  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.pink },
  chipText: { ...type.small, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.white },

  toggle: {
    width: 46,
    height: 27,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.pink },
  toggleKnob: {
    width: 21,
    height: 21,
    borderRadius: radius.pill,
    backgroundColor: colors.textFaint,
  },
  toggleKnobOn: { backgroundColor: colors.white, alignSelf: 'flex-end' },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleText: { ...type.title, color: colors.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center' },
  sectionActionText: { ...type.small, color: colors.pink, marginRight: 2 },

  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...type.h3, color: colors.text, textAlign: 'center' },
  emptyMessage: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  emptyBtn: { marginTop: spacing.xl, minWidth: 200 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...type.body, color: colors.textMuted, marginTop: spacing.lg },

  script: {
    fontFamily: fonts.script,
    color: colors.white,
    fontWeight: '300',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
