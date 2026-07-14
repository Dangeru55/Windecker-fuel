import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { Product } from '../types';
import { showAlert } from '../utils/alert';

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.unit}>/{product.unit}</Text>
        </View>
      </View>
      <Text style={styles.description}>{product.description}</Text>
      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(product)}>
        <Text style={styles.addBtnText}>Add to Order</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { user, addToCart, products, priceStatus, pricesLoading, refreshPrices } = useApp();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('100');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('100');
  };

  const confirmAdd = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      showAlert('Invalid quantity', 'Please enter a valid amount');
      return;
    }
    addToCart(selectedProduct!, qty);
    setSelectedProduct(null);
    showAlert('Added!', `${qty} ${selectedProduct!.unit}s of ${selectedProduct!.name} added to cart`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name?.split(' ')[0]}!</Text>
        <Text style={styles.companyText}>{user?.company}</Text>
        <View style={styles.priceStatusRow}>
          {pricesLoading ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
          ) : (
            <Text style={styles.priceDot}>●</Text>
          )}
          <Text style={styles.priceStatusText}>
            {pricesLoading ? 'Fetching latest prices...' : priceStatus}
          </Text>
          {!pricesLoading && (
            <TouchableOpacity onPress={refreshPrices} style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>↻ Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search fuel products..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} onAdd={handleAdd} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pricesLoading}
            onRefresh={refreshPrices}
            tintColor={COLORS.primary}
            title="Refreshing prices..."
          />
        }
      />

      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalPrice}>
              ${selectedProduct?.price.toFixed(2)} / {selectedProduct?.unit}
            </Text>
            <Text style={styles.modalLabel}>Quantity ({selectedProduct?.unit}s)</Text>
            <TextInput
              style={styles.modalInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              autoFocus
            />
            {quantity ? (
              <Text style={styles.modalTotal}>
                Subtotal: ${((selectedProduct?.price ?? 0) * parseInt(quantity || '0')).toFixed(2)}
              </Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setSelectedProduct(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={confirmAdd}>
                <Text style={styles.confirmBtnText}>Add to Cart</Text>
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
  welcome: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 16 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  companyText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  priceStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceDot: { fontSize: 8, color: COLORS.success, marginRight: 6 },
  priceStatusText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1 },
  refreshBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  refreshBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  category: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  unit: { fontSize: 12, color: COLORS.textSecondary },
  description: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 18 },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalPrice: { fontSize: 16, color: COLORS.primary, marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTotal: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
});
