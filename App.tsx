/**
 * Us — Our Story
 * A private space for two to collect, cherish and relive your best moments.
 */
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { AppProvider } from './src/context/AppContext';
import { LockProvider } from './src/context/LockContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <AppProvider>
          <LockProvider>
            <RootNavigator />
          </LockProvider>
        </AppProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
