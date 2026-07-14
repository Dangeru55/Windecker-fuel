import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
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
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {order.items.map((item) => (
        <View key={item.product.id} style={styles.itemRow}>
          <Text style={styles.itemName}>{item.product.name}</Text>
          <Text style={styles.itemQty}>{item.quantity.toLocaleString()} {item.product.unit}s</Text>
          <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <Text style={styles.address} numberOfLines={1}>📍 {order.deliveryAddress}</Text>
        <Text style={styles.orderTotal}>${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      </View>

      <TouchableOpacity style={styles.reorderBtn} onPress={() => onReorder(order)}>
        <Text style={styles.reorderBtnText}>🔄  Reorder</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrderHistoryScreen() {
  const { orders, addToCart, clearCart } = useApp();

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
        <Text style={styles.emptyIcon}>📋</Text>
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
  list: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  orderDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 14, color: COLORS.text },
  itemQty: { fontSize: 13, color: COLORS.textSecondary, marginHorizontal: 8 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  address: { flex: 1, fontSize: 12, color: COLORS.textSecondary, marginRight: 8 },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  reorderBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reorderBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
