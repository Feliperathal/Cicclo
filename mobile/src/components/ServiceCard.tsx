import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LaundryServiceResponse } from '../types/api';
import { formatCurrency } from '../utils/currency';

interface ServiceCardProps {
  service: LaundryServiceResponse;
  disabled: boolean;
  loading: boolean;
  onConsume: (service: LaundryServiceResponse) => void;
}

export function ServiceCard({ service, disabled, loading, onConsume }: ServiceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.details}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.price}>{formatCurrency(service.price)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Utilizar serviço ${service.name}`}
        disabled={disabled}
        onPress={() => onConsume(service)}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Utilizar serviço</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
    borderWidth: 1,
    borderColor: '#DCE4E2',
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    color: '#18302F',
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    color: '#0B6E69',
    fontSize: 18,
    fontWeight: '700',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#0B6E69',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    backgroundColor: '#075451',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
