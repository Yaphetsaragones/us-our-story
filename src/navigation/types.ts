import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/** Where a grid of memories came from — drives its title and its contents. */
export type CollectionSource = 'album' | 'moment' | 'all' | 'favorites' | 'onThisDay' | 'hidden';

export type RootStackParamList = {
  Welcome: undefined;
  CreateCouple: undefined;
  JoinCouple: undefined;
  Invite: undefined;

  Tabs: undefined;

  Import: { albumId?: string } | undefined;
  Collection: { source: CollectionSource; id?: string; title?: string };
  Search: undefined;
  Viewer: { ids: string[]; index: number; title?: string };
  MemoryEdit: { id: string };
  StoryEventEdit: { id?: string };

  LoveNotes: undefined;
  Countdowns: undefined;
  MemoryOfTheDay: undefined;
  OurYear: { year?: number } | undefined;
  YearMovie: { year: number };
  Privacy: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Moments: undefined;
  Timeline: undefined;
  Us: undefined;
};

export type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
