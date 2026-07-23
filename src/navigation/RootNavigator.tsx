import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { RootStackParamList, TabParamList } from '../types';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Cart: { active: 'cart', inactive: 'cart-outline' },
  Orders: { active: 'receipt', inactive: 'receipt-outline' },
  Account: { active: 'person', inactive: 'person-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  if (name === 'Home') {
    // logo.png is a huge canvas (1545x2000) with the actual mark occupying a
    // small fraction of it, so scaling the raw file into a 30x30 box shrank the
    // visible logo to a few pixels -- far smaller than the solid Ionicons glyphs
    // beside it. nav-icon.png is the speedometer mark only (the wordmark below
    // it is illegible at this size anyway), pre-trimmed to its own bounding box
    // so no space is wasted, and sized wider than it is tall since the mark
    // itself is a wide, flat shape -- forcing it into a square would shrink it
    // right back down to a sliver.
    return (
      <Image
        source={require('../../assets/nav-icon.png')}
        style={{ width: 40, height: 40 * (269 / 940), opacity: focused ? 1 : 0.45 }}
        resizeMode="contain"
      />
    );
  }
  const icon = TAB_ICONS[name];
  return <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />;
}

function MainTabs() {
  const { cartCount } = useApp();
  // Saved-to-home-screen (standalone) mode has no browser chrome, so the tab
  // bar sits flush against the bottom of the physical screen -- under the iOS
  // home-indicator area. A fixed paddingBottom looked fine in a normal browser
  // tab (which reserves that space itself) but got clipped once standalone.
  // insets.bottom is 0 on a regular web page, so this only changes anything in
  // standalone.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          // The safe-area inset must be pure addition on top of the original
          // content height, not taken out of it -- shrinking the base height to
          // make room left too little space for icon + label together, and the
          // labels got clipped invisibly instead of the bar getting taller.
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 10 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
        headerStyle: {
          backgroundColor: COLORS.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
        headerTitleAlign: 'left',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Windecker Fuel',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'My Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.primary, fontSize: 10, fontWeight: '700' },
          tabBarIcon: ({ focused, color }) => <TabIcon name="Cart" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          title: 'Order History',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Orders" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'My Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Account" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useApp();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
