import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { testApiConnection } from '../services/api';
import { ApiUrlValidationError, normalizeApiUrl } from '../services/apiConfig';

interface ServerConfigModalProps {
  currentUrl: string | null;
  visible: boolean;
  onCancel: () => void;
  onSave: (url: string) => Promise<void>;
}

interface ModalMessage {
  kind: 'success' | 'error';
  text: string;
}

function validationMessage(error: unknown): string {
  return error instanceof ApiUrlValidationError
    ? error.message
    : 'Não foi possível conectar ao servidor. Verifique o endereço e a rede.';
}

export function ServerConfigModal({
  currentUrl,
  visible,
  onCancel,
  onSave,
}: ServerConfigModalProps) {
  const [url, setUrl] = useState(currentUrl ?? '');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<ModalMessage | null>(null);

  useEffect(() => {
    if (visible) {
      setUrl(currentUrl ?? '');
      setMessage(null);
    }
  }, [currentUrl, visible]);

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      await testApiConnection(url);
      setMessage({ kind: 'success', text: 'Conexão com o servidor estabelecida.' });
    } catch (error) {
      setMessage({ kind: 'error', text: validationMessage(error) });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);

    try {
      normalizeApiUrl(url);
      setSaving(true);
      await onSave(url);
    } catch (error) {
      setMessage({
        kind: 'error',
        text:
          error instanceof ApiUrlValidationError
            ? error.message
            : 'Não foi possível salvar a configuração. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const busy = testing || saving;

  return (
    <Modal animationType="fade" onRequestClose={currentUrl && !busy ? onCancel : undefined} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Configuração do servidor</Text>
          <Text style={styles.description}>
            Informe a raiz da API disponível na mesma rede do dispositivo.
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            keyboardType="url"
            onChangeText={(value) => {
              setUrl(value);
              setMessage(null);
            }}
            placeholder="http://192.168.1.100:5046"
            style={styles.input}
            value={url}
          />

          {message ? (
            <Text style={message.kind === 'success' ? styles.successText : styles.errorText}>
              {message.text}
            </Text>
          ) : null}

          <Pressable disabled={busy} onPress={() => void handleTest()} style={styles.secondaryButton}>
            {testing ? <ActivityIndicator color="#0B6E69" /> : <Text style={styles.secondaryText}>Testar conexão</Text>}
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              disabled={!currentUrl || busy}
              onPress={onCancel}
              style={[styles.cancelButton, (!currentUrl || busy) && styles.disabledButton]}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void handleSave()} style={styles.saveButton}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Salvar</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(7, 59, 58, 0.45)',
  },
  card: { gap: 16, borderRadius: 24, padding: 22, backgroundColor: '#FFFFFF' },
  title: { color: '#073B3A', fontSize: 22, fontWeight: '800' },
  description: { color: '#58706E', fontSize: 14, lineHeight: 20 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#AFC4C1',
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#18302F',
    fontSize: 15,
  },
  successText: { color: '#17643B', fontSize: 14, lineHeight: 20 },
  errorText: { color: '#9B3030', fontSize: 14, lineHeight: 20 },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0B6E69',
    borderRadius: 14,
  },
  secondaryText: { color: '#0B6E69', fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EDF3F2',
  },
  cancelText: { color: '#42615E', fontSize: 15, fontWeight: '700' },
  saveButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#0B6E69',
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.45 },
});
