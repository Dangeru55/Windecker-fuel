import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { Product } from '../types';
import { showAlert } from '../utils/alert';

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>${product.price.toFixed(4)}</Text>
          <Text style={styles.unit}>per {product.unit}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(product)} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={COLORS.white} />
        <Text style={styles.addBtnText}>Add to Order</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const {
    user, addToCart, products, priceStatus, pricesLoading, refreshPrices,
    destinations, destinationId, selectDestination,
  } = useApp();
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

  const ListHeader = (
    <View>
      <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.company}>{user?.company}</Text>

      <View style={styles.priceStatusRow}>
        {pricesLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
        ) : (
          <View style={styles.liveDot} />
        )}
        <Text style={styles.priceStatusText}>
          {pricesLoading ? 'Fetching latest prices…' : priceStatus}
        </Text>
        {!pricesLoading && (
          <TouchableOpacity onPress={refreshPrices} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Only shown to multi-site customers: each site has its own freight and
          margin, so the price depends on where it's being delivered. */}
      {destinations.length > 1 && (
        <View style={styles.destSection}>
          <Text style={styles.destLabel}>Delivering to</Text>
          <View style={styles.destRow}>
            {destinations.map((d) => {
              const active = d.id === destinationId;
              // Several sites can share a name and differ only by the rack they
              // pull from (#1 Gas has two "Berkeley" sites, Richmond and East
              // Bay, at different freight) — show the rack to tell them apart.
              const ambiguous =
                destinations.filter((o) => o.name === d.name).length > 1 && !!d.area;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => !active && selectDestination(d.id)}
                  style={[styles.destChip, active && styles.destChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.destChipText, active && styles.destChipTextActive]}>
                    {ambiguous ? `${d.name} · ${d.area}` : d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fuel products"
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Products</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} onAdd={handleAdd} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pricesLoading}
            onRefresh={refreshPrices}
            tintColor={COLORS.primary}
          />
        }
      />

      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalPrice}>
              ${selectedProduct?.price.toFixed(4)} per {selectedProduct?.unit}
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
                Subtotal ${((selectedProduct?.price ?? 0) * parseInt(quantity || '0')).toFixed(2)}
              </Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setSelectedProduct(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={confirmAdd} activeOpacity={0.8}>
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
  list: { paddingHorizontal: 20, paddingBottom: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },

  greeting: { fontSize: 30, fontWeight: '800', color: COLORS.text, letterSpacing: -0.8, marginTop: 8 },
  company: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },

  priceStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 7 },
  priceStatusText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  destSection: { marginTop: 18 },
  destLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  destChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  destChipText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  destChipTextActive: { color: COLORS.white },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: COLORS.muted,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: -0.4, marginTop: 24, marginBottom: 12 },

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardInfo: { flex: 1, paddingRight: 12 },
  category: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: { fontSize: 17, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  description: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 19 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  unit: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  addBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
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
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  modalPrice: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 22 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.muted,
    borderRadius: 14,
    padding: 14,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalTotal: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 14,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 24, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: COLORS.muted },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.primary },
  confirmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
