import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { showAlert } from '../utils/alert';

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.rowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, label, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuItem, last && styles.rowLast]} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const { user, logout, orders } = useApp();

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const totalSpend = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.company}>{user?.company}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {orders.filter((o) => o.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>${(totalSpend / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.card}>
          <InfoRow label="Full Name" value={user?.name ?? ''} />
          <InfoRow label="Email" value={user?.email ?? ''} />
          <InfoRow label="Phone" value={user?.phone ?? ''} />
          <InfoRow label="Company" value={user?.company ?? ''} last />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <MenuItem icon="call-outline" label="Call Windecker Fuel" />
          <MenuItem icon="mail-outline" label="Email Support" />
          <MenuItem icon="document-text-outline" label="Terms & Conditions" last />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, alignItems: 'center', maxWidth: 640, width: '100%', alignSelf: 'center' },

  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 23, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  company: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2, marginBottom: 22 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 18,
    width: '100%',
    marginBottom: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 21, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  section: { width: '100%', marginBottom: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.8, paddingLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.muted,
  },
  rowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.muted,
  },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary + '14',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.error + '12',
    borderRadius: 24,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
});
