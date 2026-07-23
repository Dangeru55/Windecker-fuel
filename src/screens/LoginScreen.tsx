import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants';
import { showAlert } from '../utils/alert';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

export default function LoginScreen() {
  const { login, createAccount } = useApp();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Defaults on (most people signing in on their own device want this); a
  // stored email with the box unchecked would be confusing, so unchecking
  // clears it immediately rather than waiting for the next login.
  const [rememberEmail, setRememberEmail] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then((saved) => {
      if (saved) setEmail(saved);
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const trimmedEmail = email.trim();
    const success = await login(trimmedEmail, password);
    setLoading(false);
    if (!success) {
      showAlert('Login Failed', 'Invalid email or password');
      return;
    }
    if (rememberEmail) {
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
    } else {
      await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  };

  const handleCreateAccount = async () => {
    if (!email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await createAccount(email.trim(), password);
    } catch (err) {
      showAlert('Could Not Create Account', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'signin' | 'create') => {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Logo banner — fills top of card like CRM */}
          <View style={styles.logoBanner}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.fuelServices}>FUEL SERVICES</Text>
          </View>

          {/* Form below — connected directly to logo banner */}
          <View style={styles.form}>
            {mode === 'signin' ? (
              <>
                <Text style={styles.heading}>Sign in</Text>
                <Text style={styles.subtitle}>Use your Windecker account to sign in</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@windeckerfuel.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberEmail((v) => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
                    {rememberEmail && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                  </View>
                  <Text style={styles.rememberText}>Remember email address</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.createBtn} onPress={() => switchMode('create')} disabled={loading}>
                  <Text style={styles.createBtnText}>Create Account</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.heading}>Create Account</Text>
                <Text style={styles.subtitle}>Use the email Windecker has on file for your company</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@windeckerfuel.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Create Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleCreateAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.createBtn} onPress={() => switchMode('signin')} disabled={loading}>
                  <Text style={styles.createBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Text style={styles.footer}>© 2025 Windecker Fuel Services</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logoBanner: {
    backgroundColor: COLORS.white,
    height: 240,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'hidden',
  },
  logo: { width: '100%', flex: 1 },
  fuelServices: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: -170,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  form: { padding: 28 },
  heading: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 16 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rememberText: { fontSize: 13, color: COLORS.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  createBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  createBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, marginTop: 16 },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 20 },
});
