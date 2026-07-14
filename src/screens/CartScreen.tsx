import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { CartItem } from '../types';
import { showAlert } from '../utils/alert';

function CartRow({ item, onRemove, onUpdate }: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, qty: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.product.name}</Text>
        <Text style={styles.rowPrice}>
          ${item.product.price.toFixed(2)} / {item.product.unit}
        </Text>
      </View>
      <View style={styles.rowControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onUpdate(item.product.id, item.quantity - 50)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onUpdate(item.product.id, item.quantity + 50)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowTotal}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => onRemove(item.product.id)}>
          <Text style={styles.removeBtn}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, placeOrder } = useApp();
  const [address, setAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const handleOrder = () => {
    if (!address.trim()) {
      showAlert('Address Required', 'Please enter a delivery address');
      return;
    }
    placeOrder(address);
    setShowCheckout(false);
    setAddress('');
    showAlert('Order Placed!', 'Your fuel order has been submitted. We will contact you to confirm delivery.');
  };

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Go to Home to browse and add fuel products</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <CartRow
            item={item}
            onRemove={removeFromCart}
            onUpdate={updateCartQuantity}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
        </View>
        <Text style={styles.disclaimer}>Final price confirmed at delivery</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)}>
          <Text style={styles.checkoutBtnText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <Text style={styles.modalLabel}>Delivery Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Street, City, State, ZIP"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            <View style={styles.orderSummary}>
              <Text style={styles.summaryItem}>{cart.length} product type(s)</Text>
              <Text style={styles.summaryTotal}>Total: ${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowCheckout(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleOrder}>
                <Text style={styles.confirmBtnText}>Confirm Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  row: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rowPrice: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  qty: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginHorizontal: 8, minWidth: 36, textAlign: 'center' },
  rowRight: { alignItems: 'flex-end' },
  rowTotal: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  removeBtn: { fontSize: 14, color: COLORS.error, marginTop: 4 },
  footer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  disclaimer: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 16 },
  checkoutBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center' },
  checkoutBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 16,
    backgroundColor: COLORS.background, textAlignVertical: 'top',
  },
  orderSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: COLORS.background, borderRadius: 8, padding: 12, marginBottom: 16,
  },
  summaryItem: { color: COLORS.textSecondary, fontSize: 14 },
  summaryTotal: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
