import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ServerConfigModal } from './src/components/ServerConfigModal';
import { ServiceCard } from './src/components/ServiceCard';
import { WalletCard } from './src/components/WalletCard';
import { ApiConnectionError, ApiError, consumeLaundryService, getLaundryServices, getWallet } from './src/services/api';
import { loadApiConfig, saveApiUrl } from './src/services/apiConfig';
import { hasApiUrlChanged } from './src/services/apiUrl';
import type { LaundryServiceResponse } from './src/types/api';
import { formatCurrency } from './src/utils/currency';

const ACCOUNT_ID = 1;
const CONNECTION_ERROR = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

interface Feedback {
  kind: 'success' | 'error' | 'warning';
  message: string;
}

function readableLoadError(error: unknown): string {
  return error instanceof ApiConnectionError ? CONNECTION_ERROR : 'Não foi possível carregar os dados. Tente novamente.';
}

export default function App() {
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configVisible, setConfigVisible] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<LaundryServiceResponse[] | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [consumingServiceId, setConsumingServiceId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const consumeLock = useRef(false);
  const serverGeneration = useRef(0);

  const loadWallet = useCallback(async () => {
    const generation = serverGeneration.current;
    setWalletLoading(true);
    setWalletError(null);
    try {
      const wallet = await getWallet(ACCOUNT_ID);
      if (generation === serverGeneration.current) setBalance(wallet.balance);
    } catch (error) {
      if (generation === serverGeneration.current) {
        setBalance(null);
        setWalletError(readableLoadError(error));
      }
    } finally {
      if (generation === serverGeneration.current) setWalletLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    const generation = serverGeneration.current;
    setServicesLoading(true);
    setServicesError(null);
    try {
      const result = await getLaundryServices();
      if (generation === serverGeneration.current) setServices(result);
    } catch (error) {
      if (generation === serverGeneration.current) {
        setServices(null);
        setServicesError(readableLoadError(error));
      }
    } finally {
      if (generation === serverGeneration.current) setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const config = await loadApiConfig();
      setApiUrl(config.url);
      setConfigVisible(config.url === null);
      setConfigLoading(false);
      if (config.warning) setFeedback({ kind: 'warning', message: config.warning });
    })();
  }, []);

  useEffect(() => {
    if (!configLoading && apiUrl) void Promise.allSettled([loadWallet(), loadServices()]);
  }, [apiUrl, configLoading, loadServices, loadWallet]);

  const handleSaveServer = useCallback(async (value: string) => {
    const serverChanged = hasApiUrlChanged(apiUrl, value);
    const normalizedUrl = await saveApiUrl(value);

    if (!serverChanged) {
      setConfigVisible(false);
      return;
    }

    serverGeneration.current += 1;
    setBalance(null);
    setServices(null);
    setWalletError(null);
    setServicesError(null);
    setFeedback(null);
    setWalletLoading(false);
    setServicesLoading(false);
    setApiUrl(normalizedUrl);
    setConfigVisible(false);
  }, [apiUrl]);

  const handleOpenConfig = () => {
    if (consumeLock.current) {
      setFeedback({ kind: 'warning', message: 'Aguarde a conclusão da solicitação antes de alterar o servidor.' });
      return;
    }
    setConfigVisible(true);
  };

  const handleConsume = useCallback(async (service: LaundryServiceResponse) => {
    if (consumeLock.current) return;
    consumeLock.current = true;
    const generation = serverGeneration.current;
    setConsumingServiceId(service.id);
    setFeedback(null);

    try {
      const result = await consumeLaundryService({ accountId: ACCOUNT_ID, serviceId: service.id });
      if (generation !== serverGeneration.current) return;
      setBalance(result.remainingBalance);
      setFeedback({ kind: 'success', message: `${service.name} solicitado com sucesso. Valor debitado: ${formatCurrency(result.amount)}.` });
      try {
        const wallet = await getWallet(ACCOUNT_ID);
        if (generation === serverGeneration.current) setBalance(wallet.balance);
      } catch {
        // The completed consume response remains authoritative.
      }
    } catch (error) {
      if (generation !== serverGeneration.current) return;
      if (error instanceof ApiError && error.status === 409 && error.problem?.title === 'InsufficientBalance') {
        setFeedback({ kind: 'error', message: 'Saldo insuficiente para utilizar este serviço.' });
      } else if (error instanceof ApiError && error.status === 404 && error.problem?.title === 'ServiceNotFound') {
        setFeedback({ kind: 'error', message: 'Este serviço não está mais disponível.' });
        void loadServices();
      } else if (error instanceof ApiConnectionError) {
        setFeedback({ kind: 'warning', message: 'Não foi possível confirmar o resultado. O saldo será sincronizado; não repetiremos a solicitação automaticamente.' });
        await loadWallet();
      } else {
        setFeedback({ kind: 'error', message: 'Não foi possível concluir a solicitação. Tente novamente.' });
      }
    } finally {
      consumeLock.current = false;
      if (generation === serverGeneration.current) setConsumingServiceId(null);
    }
  }, [loadServices, loadWallet]);

  const initialLoading = configLoading || (Boolean(apiUrl) && walletLoading && servicesLoading && balance === null && services === null);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.brand}>Cicclo</Text>
              <Text style={styles.subtitle}>Lavanderia automatizada, simples e rápida.</Text>
            </View>
            <Pressable accessibilityLabel="Configuração do servidor" accessibilityRole="button" onPress={handleOpenConfig} style={styles.configButton}>
              <Text style={styles.configIcon}>⚙</Text>
            </Pressable>
          </View>

          {initialLoading ? (
            <View style={styles.initialLoading}>
              <ActivityIndicator size="large" color="#0B6E69" />
              <Text style={styles.loadingText}>{configLoading ? 'Carregando configuração...' : 'Carregando sua experiência...'}</Text>
            </View>
          ) : apiUrl ? (
            <>
              <WalletCard balance={balance} error={walletError} loading={walletLoading} onRetry={() => void loadWallet()} />
              {feedback ? (
                <View accessibilityLiveRegion="polite" style={[styles.feedback, feedback.kind === 'success' && styles.feedbackSuccess, feedback.kind === 'error' && styles.feedbackError, feedback.kind === 'warning' && styles.feedbackWarning]}>
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
                    <Pressable accessibilityRole="button" onPress={() => void loadServices()} style={styles.retryButton}><Text style={styles.retryText}>Tentar novamente</Text></Pressable>
                  </View>
                ) : null}
                {!servicesLoading && services?.length === 0 ? <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text> : null}
                {services?.map((service) => <ServiceCard key={service.id} disabled={consumingServiceId !== null} loading={consumingServiceId === service.id} onConsume={handleConsume} service={service} />)}
              </View>
            </>
          ) : (
            <View style={styles.noConfig}>
              <Text style={styles.noConfigTitle}>Servidor não configurado</Text>
              <Text style={styles.noConfigText}>Informe o endereço da API para carregar sua carteira e os serviços.</Text>
              <Pressable onPress={handleOpenConfig} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Configurar servidor</Text></Pressable>
            </View>
          )}
        </ScrollView>
        <ServerConfigModal currentUrl={apiUrl} onCancel={() => setConfigVisible(false)} onSave={handleSaveServer} visible={configVisible} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAF9' },
  content: { flexGrow: 1, gap: 24, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerText: { flex: 1, gap: 6 },
  brand: { color: '#073B3A', fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#58706E', fontSize: 16, lineHeight: 23 },
  configButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#DDF4EF' },
  configIcon: { color: '#073B3A', fontSize: 25 },
  initialLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 360 },
  loadingText: { color: '#58706E', fontSize: 15 },
  section: { gap: 14 },
  sectionTitle: { color: '#18302F', fontSize: 24, fontWeight: '800' },
  sectionSubtitle: { marginTop: -8, color: '#6A7E7C', fontSize: 14 },
  feedback: { borderRadius: 16, padding: 16 },
  feedbackSuccess: { backgroundColor: '#E1F4E8' },
  feedbackError: { backgroundColor: '#FCE8E8' },
  feedbackWarning: { backgroundColor: '#FFF3D6' },
  feedbackText: { color: '#283C3A', fontSize: 14, lineHeight: 21 },
  servicesError: { gap: 10, borderRadius: 16, padding: 16, backgroundColor: '#FCE8E8' },
  errorText: { color: '#7D2E2E', fontSize: 14, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#0B6E69', fontWeight: '700' },
  emptyText: { color: '#6A7E7C', fontSize: 15, paddingVertical: 16 },
  noConfig: { gap: 14, borderRadius: 20, padding: 22, backgroundColor: '#FFFFFF' },
  noConfigTitle: { color: '#18302F', fontSize: 21, fontWeight: '800' },
  noConfigText: { color: '#58706E', fontSize: 15, lineHeight: 22 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#0B6E69' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
