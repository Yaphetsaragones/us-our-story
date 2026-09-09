/** A small cross-platform text prompt (Alert.prompt is iOS-only). */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import { PrimaryButton } from './ui';

export function PromptModal({
  visible,
  title,
  message,
  placeholder,
  initialValue = '',
  confirmLabel = 'Save',
  maxLength = 80,
  keyboardType = 'default',
  secure = false,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  maxLength?: number;
  keyboardType?: 'default' | 'number-pad';
  secure?: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel} accessibilityLabel="Dismiss">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={s.card} onPress={() => {}}>
            <Text style={s.title}>{title}</Text>
            {message ? <Text style={s.message}>{message}</Text> : null}
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textFaint}
              style={s.input}
              autoFocus
              maxLength={maxLength}
              keyboardType={keyboardType}
              secureTextEntry={secure}
              selectionColor={colors.pink}
              onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
            />
            <View style={s.actions}>
              <Pressable onPress={onCancel} style={s.cancel} accessibilityRole="button">
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <PrimaryButton
                label={confirmLabel}
                onPress={() => value.trim() && onSubmit(value.trim())}
                disabled={!value.trim()}
                style={s.confirm}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { ...type.h3, color: colors.text },
  message: { ...type.small, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 19 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    color: colors.text,
    marginTop: spacing.lg,
    ...type.body,
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.md },
  cancel: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  cancelText: { ...type.body, color: colors.textMuted, fontWeight: '600' },
  confirm: { flex: 1 },
});
