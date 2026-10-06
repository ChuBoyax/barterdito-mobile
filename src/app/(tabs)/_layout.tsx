import { Tabs } from 'expo-router';

import { TabBar } from '@/components/layout';
import { tabs } from '@/navigation/tabs';
import { useTheme } from '@/providers';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, freezeOnBlur: true, sceneStyle: { backgroundColor: colors.background } }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
