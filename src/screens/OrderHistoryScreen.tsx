import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { Order } from '../types';
import { showAlert } from '../utils/alert';

const STATUS_COLORS = {
  pending: COLORS.warning,
  processing: COLORS.primaryLight,
  delivered: COLORS.success,
  cancelled: COLORS.error,
};

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function OrderCard({ order, onReorder }: { order: Order; onReorder: (order: Order) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '1A' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.itemsBlock}>
        {order.items.map((item) => (
          <View key={item.product.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemQty}>{item.quantity.toLocaleString()} {item.product.unit}s</Text>
            <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.address} numberOfLines={1}>{order.deliveryAddress}</Text>
        </View>
        <Text style={styles.orderTotal}>${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      </View>

      <TouchableOpacity style={styles.reorderBtn} onPress={() => onReorder(order)} activeOpacity={0.8}>
        <Ionicons name="repeat" size={16} color={COLORS.primary} />
        <Text style={styles.reorderBtnText}>Reorder</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrderHistoryScreen() {
  const { orders, addToCart } = useApp();

  const handleReorder = (order: Order) => {
    showAlert(
      'Reorder',
      `Add all ${order.items.length} item${order.items.length > 1 ? 's' : ''} from ${order.id} to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            order.items.forEach((item) => addToCart(item.product, item.quantity));
            showAlert('Added to Cart', 'Items from this order have been added to your cart.');
          },
        },
      ]
    );
  };

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="receipt-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your order history will appear here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} onReorder={handleReorder} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 21, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 15, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },
  orderDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  itemsBlock: {
    backgroundColor: COLORS.muted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 14,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  itemQty: { fontSize: 13, color: COLORS.textSecondary, marginHorizontal: 8 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 4 },
  address: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  orderTotal: { fontSize: 19, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },

  reorderBtn: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: COLORS.primary + '14',
    borderRadius: 22,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reorderBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
