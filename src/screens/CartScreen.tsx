import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.rowTop}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.product.name}</Text>
          <Text style={styles.rowPrice}>
            ${item.product.price.toFixed(4)} per {item.product.unit}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onRemove(item.product.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.rowBottom}>
        <View style={styles.rowControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdate(item.product.id, item.quantity - 50)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity.toLocaleString()}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdate(item.product.id, item.quantity + 50)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.rowTotal}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
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
        <View style={styles.emptyIconWrap}>
          <Ionicons name="cart-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Browse fuel products on the Home tab to get started</Text>
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
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.disclaimer}>Final price confirmed at delivery</Text>
            </View>
            <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)} activeOpacity={0.85}>
            <Text style={styles.checkoutBtnText}>Place Order</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <Text style={styles.modalLabel}>Delivery Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Street, City, State, ZIP"
              placeholderTextColor={COLORS.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            <View style={styles.orderSummary}>
              <Text style={styles.summaryItem}>{cart.length} product type(s)</Text>
              <Text style={styles.summaryTotal}>${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowCheckout(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleOrder} activeOpacity={0.8}>
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
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  row: {
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
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowInfo: { flex: 1, paddingRight: 12 },
  rowName: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  rowPrice: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.muted,
    borderRadius: 22,
    padding: 4,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginHorizontal: 14, minWidth: 44, textAlign: 'center' },
  rowTotal: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },

  footer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 10,
  },
  footerInner: { padding: 20, paddingBottom: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  totalAmount: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.6 },
  disclaimer: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.muted,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  orderSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.muted, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  summaryItem: { color: COLORS.textSecondary, fontSize: 14 },
  summaryTotal: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 24, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: COLORS.muted },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
