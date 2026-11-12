import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ServiceCard } from './src/components/ServiceCard';
import { WalletCard } from './src/components/WalletCard';
import {
  ApiConnectionError,
  ApiError,
  consumeLaundryService,
  getLaundryServices,
  getWallet,
} from './src/services/api';
import type { LaundryServiceResponse } from './src/types/api';
import { formatCurrency } from './src/utils/currency';

const ACCOUNT_ID = 1;
const CONNECTION_ERROR = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

interface Feedback {
  kind: 'success' | 'error' | 'warning';
  message: string;
}

function readableLoadError(error: unknown): string {
  if (error instanceof ApiConnectionError) {
    return CONNECTION_ERROR;
  }

  return 'Não foi possível carregar os dados. Tente novamente.';
}

export default function App() {
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<LaundryServiceResponse[] | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [consumingServiceId, setConsumingServiceId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const consumeLock = useRef(false);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);

    try {
      const wallet = await getWallet(ACCOUNT_ID);
      setBalance(wallet.balance);
    } catch (error) {
      setBalance(null);
      setWalletError(readableLoadError(error));
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError(null);

    try {
      setServices(await getLaundryServices());
    } catch (error) {
      setServices(null);
      setServicesError(readableLoadError(error));
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.allSettled([loadWallet(), loadServices()]);
  }, [loadServices, loadWallet]);

  const handleConsume = useCallback(
    async (service: LaundryServiceResponse) => {
      if (consumeLock.current) {
        return;
      }

      consumeLock.current = true;
      setConsumingServiceId(service.id);
      setFeedback(null);

      try {
        const result = await consumeLaundryService({
          accountId: ACCOUNT_ID,
          serviceId: service.id,
        });

        setBalance(result.remainingBalance);
        setFeedback({
          kind: 'success',
          message: `${service.name} solicitado com sucesso. Valor debitado: ${formatCurrency(result.amount)}.`,
        });

        try {
          const wallet = await getWallet(ACCOUNT_ID);
          setBalance(wallet.balance);
        } catch {
          // The consume response remains authoritative for this completed request.
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 && error.problem?.title === 'InsufficientBalance') {
          setFeedback({
            kind: 'error',
            message: 'Saldo insuficiente para utilizar este serviço.',
          });
        } else if (error instanceof ApiError && error.status === 404 && error.problem?.title === 'ServiceNotFound') {
          setFeedback({
            kind: 'error',
            message: 'Este serviço não está mais disponível.',
          });
          void loadServices();
        } else if (error instanceof ApiConnectionError) {
          setFeedback({
            kind: 'warning',
            message: 'Não foi possível confirmar o resultado. O saldo será sincronizado; não repetiremos a solicitação automaticamente.',
          });
          await loadWallet();
        } else {
          setFeedback({
            kind: 'error',
            message: 'Não foi possível concluir a solicitação. Tente novamente.',
          });
        }
      } finally {
        consumeLock.current = false;
        setConsumingServiceId(null);
      }
    },
    [loadServices, loadWallet],
  );

  const initialLoading = walletLoading && servicesLoading && balance === null && services === null;

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>Cicclo</Text>
          <Text style={styles.subtitle}>Lavanderia automatizada, simples e rápida.</Text>
        </View>

        {initialLoading ? (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="large" color="#0B6E69" />
            <Text style={styles.loadingText}>Carregando sua experiência...</Text>
          </View>
        ) : (
          <>
            <WalletCard
              balance={balance}
              error={walletError}
              loading={walletLoading}
              onRetry={() => void loadWallet()}
            />

            {feedback ? (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.feedback,
                  feedback.kind === 'success' && styles.feedbackSuccess,
                  feedback.kind === 'error' && styles.feedbackError,
                  feedback.kind === 'warning' && styles.feedbackWarning,
                ]}
              >
                <Text style={styles.feedbackText}>{feedback.message}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Serviços disponíveis</Text>
              <Text style={styles.sectionSubtitle}>Escolha o cuidado ideal para suas roupas.</Text>

              {servicesLoading ? <ActivityIndicator color="#0B6E69" /> : null}
              {!servicesLoading && servicesError ? (
                <View style={styles.servicesError}>
                  <Text style={styles.errorText}>{servicesError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void loadServices()}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : null}
              {!servicesLoading && services?.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
              ) : null}
              {services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  disabled={consumingServiceId !== null}
                  loading={consumingServiceId === service.id}
                  onConsume={handleConsume}
                  service={service}
                />
              ))}
            </View>
          </>
        )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
  },
  brand: {
    color: '#073B3A',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#58706E',
    fontSize: 16,
    lineHeight: 23,
  },
  initialLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 360,
  },
  loadingText: {
    color: '#58706E',
    fontSize: 15,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: '#18302F',
    fontSize: 24,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: -8,
    color: '#6A7E7C',
    fontSize: 14,
  },
  feedback: {
    borderRadius: 16,
    padding: 16,
  },
  feedbackSuccess: {
    backgroundColor: '#E1F4E8',
  },
  feedbackError: {
    backgroundColor: '#FCE8E8',
  },
  feedbackWarning: {
    backgroundColor: '#FFF3D6',
  },
  feedbackText: {
    color: '#283C3A',
    fontSize: 14,
    lineHeight: 21,
  },
  servicesError: {
    gap: 10,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FCE8E8',
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
  emptyText: {
    color: '#6A7E7C',
    fontSize: 15,
    paddingVertical: 16,
  },
});
