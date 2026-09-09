import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { Loading } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useLock } from '../context/LockContext';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateCoupleScreen } from '../screens/CreateCoupleScreen';
import { JoinCoupleScreen } from '../screens/JoinCoupleScreen';
import { InviteScreen } from '../screens/InviteScreen';
import { LockScreen } from '../screens/LockScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MomentsScreen } from '../screens/MomentsScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { UsScreen } from '../screens/UsScreen';
import { ImportScreen } from '../screens/ImportScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { ViewerScreen } from '../screens/ViewerScreen';
import { MemoryEditScreen } from '../screens/MemoryEditScreen';
import { StoryEventEditScreen } from '../screens/StoryEventEditScreen';
import { LoveNotesScreen } from '../screens/LoveNotesScreen';
import { CountdownsScreen } from '../screens/CountdownsScreen';
import { MemoryOfTheDayScreen } from '../screens/MemoryOfTheDayScreen';
import { OurYearScreen } from '../screens/OurYearScreen';
import { YearMovieScreen } from '../screens/YearMovieScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.borderSoft,
    primary: colors.pink,
  },
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['usourstory://'],
  config: {
    screens: {
      JoinCouple: 'join/:code',
    },
  },
};

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

function Tabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Moments" component={MomentsScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Us" component={UsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { data, ready } = useApp();
  const { locked } = useLock();

  if (!ready) return <Loading message="Opening your space…" />;

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        initialRouteName={data.onboarded ? 'Tabs' : 'Welcome'}>
        {/* Onboarding */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateCouple" component={CreateCoupleScreen} />
        <Stack.Screen name="JoinCouple" component={JoinCoupleScreen} />
        <Stack.Screen name="Invite" component={InviteScreen} />

        {/* The app */}
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="Import"
          component={ImportScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Collection" component={CollectionScreen} />
        <Stack.Screen
          name="Viewer"
          component={ViewerScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="MemoryEdit" component={MemoryEditScreen} />
        <Stack.Screen name="StoryEventEdit" component={StoryEventEditScreen} />
        <Stack.Screen name="LoveNotes" component={LoveNotesScreen} />
        <Stack.Screen name="Countdowns" component={CountdownsScreen} />
        <Stack.Screen name="MemoryOfTheDay" component={MemoryOfTheDayScreen} />
        <Stack.Screen name="OurYear" component={OurYearScreen} />
        <Stack.Screen
          name="YearMovie"
          component={YearMovieScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>

      {/* Overlaid rather than swapped in, so unlocking returns you where you were. */}
      {locked ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen />
        </View>
      ) : null}
    </NavigationContainer>
  );
}
