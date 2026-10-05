import { Tabs } from 'expo-router';
import { ArrowRightLeft, Compass, Grid2X2, Inbox, User } from 'lucide-react-native';

import { HeaderActions, MenuButton } from '@/components/layout';
import { useTheme } from '@/providers';
import { fonts } from '@/theme';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 10.5 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          headerTitle: 'Barterdito',
          headerLeft: () => <MenuButton />,
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          headerTitle: 'Trade Offers',
          tabBarIcon: ({ color, size }) => <ArrowRightLeft color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarBadge: 2,
          tabBarBadgeStyle: { backgroundColor: colors.orange, fontFamily: fonts.bold, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-items"
        options={{
          title: 'My Items',
          tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
