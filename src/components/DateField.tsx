/** A tappable date row backed by the platform's native date picker. */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radius, spacing, type } from '../theme';
import { fmtDate } from '../lib/date';
import { Icon } from './ui';

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Choose a date',
  minimumDate,
  maximumDate,
}: {
  label?: string;
  value?: number;
  onChange: (ts: number) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  const handle = (event: DateTimePickerEvent, date?: Date) => {
    // Android fires once and dismisses itself; iOS keeps the spinner mounted.
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') return;
    if (date) onChange(date.getTime());
  };

  return (
    <View style={s.wrap}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        style={({ pressed }) => [s.field, pressed && s.pressed]}>
        <Icon name="calendar-outline" size={18} color={colors.pink} />
        <Text style={[s.value, !value && s.placeholder]}>
          {value ? fmtDate(value) : placeholder}
        </Text>
        <Icon name="chevron-forward" size={15} color={colors.textFaint} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={new Date(value ?? Date.now())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handle}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant="dark"
        />
      ) : null}

      {open && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setOpen(false)} style={s.done} accessibilityRole="button">
          <Text style={s.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  pressed: { backgroundColor: colors.surfacePressed },
  value: { ...type.body, color: colors.text, flex: 1, marginLeft: spacing.md },
  placeholder: { color: colors.textFaint },
  done: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  doneText: { ...type.body, color: colors.pink, fontWeight: '600' },
});
