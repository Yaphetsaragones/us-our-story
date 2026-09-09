/**
 * App lock. The space re-locks whenever the app goes to the background, so a
 * phone handed to someone else never opens straight into your memories.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useApp } from './AppContext';

const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export type BiometryLabel = 'Face ID' | 'Touch ID' | 'Fingerprint' | 'Biometrics';

interface LockContextValue {
  locked: boolean;
  /** Whether the device actually has a usable biometric sensor. */
  biometryAvailable: boolean;
  biometryLabel: BiometryLabel;
  unlockWithBiometrics(): Promise<boolean>;
  unlockWithPasscode(code: string): boolean;
  lockNow(): void;
}

const LockContext = createContext<LockContextValue | null>(null);

/** Grace period so the picker or camera returning does not demand a re-unlock. */
const BACKGROUND_GRACE_MS = 20000;

export function LockProvider({ children }: { children: React.ReactNode }) {
  const { data, ready, verifyPasscode } = useApp();
  const lockEnabled = data.settings.appLockEnabled && !!data.settings.passcodeHash;

  const [locked, setLocked] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState<BiometryLabel>('Biometrics');
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    biometrics
      .isSensorAvailable()
      .then(({ available, biometryType }) => {
        if (cancelled) return;
        setBiometryAvailable(available);
        if (biometryType === BiometryTypes.FaceID) setBiometryLabel('Face ID');
        else if (biometryType === BiometryTypes.TouchID) setBiometryLabel('Touch ID');
        else if (biometryType === BiometryTypes.Biometrics) setBiometryLabel('Fingerprint');
      })
      .catch(() => {
        if (!cancelled) setBiometryAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock on first load once we know a passcode is set.
  useEffect(() => {
    if (ready && lockEnabled) setLocked(true);
  }, [ready, lockEnabled]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (lockEnabled && since !== null && Date.now() - since > BACKGROUND_GRACE_MS) {
          setLocked(true);
        }
      } else if (state === 'background' || state === 'inactive') {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [lockEnabled]);

  const unlockWithBiometrics = useCallback(async () => {
    try {
      const { success } = await biometrics.simplePrompt({
        promptMessage: 'Unlock your memories',
        cancelButtonText: 'Use passcode',
      });
      if (success) setLocked(false);
      return success;
    } catch {
      return false;
    }
  }, []);

  const unlockWithPasscode = useCallback(
    (code: string) => {
      const ok = verifyPasscode(code);
      if (ok) setLocked(false);
      return ok;
    },
    [verifyPasscode],
  );

  const lockNow = useCallback(() => {
    if (lockEnabled) setLocked(true);
  }, [lockEnabled]);

  const value = useMemo<LockContextValue>(
    () => ({
      locked: lockEnabled && locked,
      biometryAvailable,
      biometryLabel,
      unlockWithBiometrics,
      unlockWithPasscode,
      lockNow,
    }),
    [
      lockEnabled,
      locked,
      biometryAvailable,
      biometryLabel,
      unlockWithBiometrics,
      unlockWithPasscode,
      lockNow,
    ],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside <LockProvider>');
  return ctx;
}
