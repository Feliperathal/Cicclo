import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../utils/currency';

interface WalletCardProps {
  balance: number | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export function WalletCard({ balance, error, loading, onRetry }: WalletCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MINHA CARTEIRA</Text>
      {loading ? <ActivityIndicator color="#0B6E69" /> : null}
      {!loading && balance !== null ? (
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
      ) : null}
      {!loading && error ? (
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    justifyContent: 'space-between',
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#DDF4EF',
  },
  eyebrow: {
    color: '#42615E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balance: {
    color: '#073B3A',
    fontSize: 38,
    fontWeight: '800',
  },
  errorContent: {
    gap: 12,
  },
  errorText: {
    color: '#7D2E2E',
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: '#0B6E69',
    fontWeight: '700',
  },
});
