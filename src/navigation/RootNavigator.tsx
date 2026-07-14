import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
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
    return (
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: 30, height: 30, opacity: focused ? 1 : 0.45 }}
        resizeMode="contain"
      />
    );
  }
  const icon = TAB_ICONS[name];
  return <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />;
}

function MainTabs() {
  const { cartCount } = useApp();
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
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
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
