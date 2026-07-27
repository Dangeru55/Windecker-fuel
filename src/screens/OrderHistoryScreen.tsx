import React from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { CustomerOrder, OrderStatus, statusLabel, statusHint } from '../services/orderService';

/**
 * Real order status, straight from the CRM. This is the half that removes the
 * phone call in both directions: the customer can see we have their order and
 * what's happening, without anyone having to ring and ask.
 */

const STATUS_COLOR: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  confirmed: { bg: '#DBEAFE', fg: '#1E40AF' },
  scheduled: { bg: '#E0E7FF', fg: '#3730A3' },
  delivered: { bg: '#D1FAE5', fg: '#065F46' },
  rejected: { bg: '#FEE2E2', fg: '#991B1B' },
  cancelled: { bg: '#F3F4F6', fg: '#6B7280' },
};

// The happy path, in order. Terminal states that aren't "delivered" get no
// track — showing progress toward a delivery that isn't coming would mislead.
const TRACK: OrderStatus[] = ['pending', 'confirmed', 'scheduled', 'delivered'];

function StatusTrack({ status }: { status: OrderStatus }) {
  if (!TRACK.includes(status)) return null;
  const reached = TRACK.indexOf(status);
  return (
    <View style={styles.track}>
      {TRACK.map((s, i) => {
        const done = i <= reached;
        return (
          <React.Fragment key={s}>
            <View style={styles.trackStep}>
              <View style={[styles.dot, done && styles.dotDone]}>
                {done && <Ionicons name="checkmark" size={10} color={COLORS.white} />}
              </View>
              <Text style={[styles.trackLabel, done && styles.trackLabelDone]}>{statusLabel(s)}</Text>
            </View>
            {i < TRACK.length - 1 && (
              <View style={[styles.trackLine, i < reached && styles.trackLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const c = STATUS_COLOR[order.status];
  const placed = new Date(order.createdAt.replace(' ', 'T') + 'Z');
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>
            {placed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
          <Text style={[styles.badgeText, { color: c.fg }]}>{statusLabel(order.status)}</Text>
        </View>
      </View>

      <Text style={styles.hint}>{statusHint(order)}</Text>

      <StatusTrack status={order.status} />

      <View style={styles.items}>
        {order.items.map((i, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
            <Text style={styles.itemQty}>
              {i.quantity.toLocaleString()} {i.unit}{i.quantity === 1 ? '' : 's'}
            </Text>
            <Text style={styles.itemTotal}>${i.lineTotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
      </View>

      {order.deliveryAddress ? (
        <Text style={styles.address} numberOfLines={2}>
          <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} /> {order.deliveryAddress}
        </Text>
      ) : null}
    </View>
  );
}

export default function OrderHistoryScreen() {
  const { orders, ordersLoading, refreshOrders } = useApp();

  if (orders.length === 0 && !ordersLoading) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="receipt-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>
          Orders you place will appear here, with live status as we confirm and schedule them.
        </Text>
        <TouchableOpacity onPress={refreshOrders} style={styles.refreshBtn} activeOpacity={0.8}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => String(o.id)}
      renderItem={({ item }) => <OrderCard order={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={ordersLoading} onRefresh={refreshOrders} tintColor={COLORS.primary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.background },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.muted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  refreshBtn: {
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  refreshBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  hint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 10, lineHeight: 19 },

  track: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  trackStep: { alignItems: 'center', width: 62 },
  dot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  trackLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  trackLabelDone: { color: COLORS.text, fontWeight: '600' },
  trackLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginTop: -14 },
  trackLineDone: { backgroundColor: COLORS.primary },

  items: { marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.muted, paddingTop: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  itemName: { flex: 1, fontSize: 13, color: COLORS.text },
  itemQty: { fontSize: 12, color: COLORS.textSecondary, marginHorizontal: 10 },
  itemTotal: { fontSize: 13, fontWeight: '600', color: COLORS.text, minWidth: 64, textAlign: 'right' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.muted, marginTop: 10, paddingTop: 10,
  },
  totalLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalAmount: { fontSize: 17, fontWeight: '800', color: COLORS.text },

  address: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
});
