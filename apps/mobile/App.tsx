import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WebSocketService } from './src/services/websocket';

const BACKEND_URL = process.env.BACKEND_URL || 'http://10.0.2.2:3000';
const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL || 'http://10.0.2.2:3000';
const DEVICE_ID = process.env.DEVICE_ID || 'device_dev_1';
const DEFAULT_PHONE_NUMBER = process.env.DEFAULT_PHONE_NUMBER || '+919876543210';
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'Jio';
const DEFAULT_NAME = process.env.DEFAULT_NAME || 'Dev Simulator SIM1';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [permissions, setPermissions] = useState({
    sms: false,
    phone: false,
    location: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('unregistered'); // 'unregistered', 'registering', 'registered', 'error'
  const [backendUrl, setBackendUrl] = useState(BACKEND_URL);
  const [wsUrl, setWsUrl] = useState(GATEWAY_WS_URL);
  const [deviceId, setDeviceId] = useState(DEVICE_ID);
  const [deviceName, setDeviceName] = useState(DEFAULT_NAME);
  const [simPhoneNumber, setSimPhoneNumber] = useState(DEFAULT_PHONE_NUMBER);
  const [carrierProvider, setCarrierProvider] = useState(DEFAULT_PROVIDER);

  // New states for SMS Compose UI
  const [sendType, setSendType] = useState<'single' | 'bulk'>('single');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendMessageContent, setSendMessageContent] = useState('');
  const [targetDeviceId, setTargetDeviceId] = useState(deviceId);
  const [sendingSms, setSendingSms] = useState(false);
  const [authEmail, setAuthEmail] = useState('admin@example.com');
  const [authPassword, setAuthPassword] = useState('securepassword');
  const [smsStatus, setSmsStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showAuthSettings, setShowAuthSettings] = useState(false);

  // Sync target device ID with current registered device ID
  useEffect(() => {
    setTargetDeviceId(deviceId);
  }, [deviceId]);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const sms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
      const phone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
      const location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      setPermissions({ sms, phone, location });
    } catch (err) {
      console.warn(err);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      setPermissions({
        sms: results[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED,
        phone: results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED,
        location: results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  // Run device registration via HTTP POST
  const registerDevice = async () => {
    if (!backendUrl.trim()) {
      Alert.alert('Validation Error', 'Backend URL cannot be empty.');
      return;
    }
    if (!deviceId.trim()) {
      Alert.alert('Validation Error', 'Device ID cannot be empty.');
      return;
    }
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(simPhoneNumber)) {
      Alert.alert(
        'Validation Error',
        'Phone number must be in E.164 format (e.g. +919876543210).'
      );
      return;
    }

    setRegistrationStatus('registering');
    try {
      const targetUrl = `${backendUrl.trim()}/api/devices/register`;
      const payload = {
        deviceId: deviceId,
        name: deviceName,
        phoneNumber: simPhoneNumber,
        provider: carrierProvider,
        publicKey: 'mock_rsa_public_key_value',
      };

      console.log('Attempting device registration...');
      console.log('Target URL:', targetUrl);
      console.log('Payload:', JSON.stringify(payload));

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setRegistrationStatus('registered');
        console.log('Device registered successfully');
      } else {
        setRegistrationStatus('error');
        console.warn('Device registration failed with status:', response.status);
      }
    } catch (err) {
      setRegistrationStatus('error');
      console.warn(
        `Network error during device registration (Target URL: ${backendUrl.trim()}/api/devices/register):`,
        err
      );
    }
  };

  // Handle SMS compose sending via Backend API
  const handleMobileSendSms = async () => {
    if (!sendRecipient.trim()) {
      Alert.alert('Validation Error', 'Recipient(s) cannot be empty.');
      return;
    }
    if (!sendMessageContent.trim()) {
      Alert.alert('Validation Error', 'Message content cannot be empty.');
      return;
    }

    setSendingSms(true);
    setSmsStatus(null);

    try {
      // 1. Silent login to obtain token
      const loginUrl = `${backendUrl.trim()}/api/auth/login`;
      console.log('Mobile App: Attempting auth login at:', loginUrl);
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (!loginResponse.ok) {
        throw new Error('Authentication failed. Check credentials.');
      }

      const loginData = await loginResponse.json();
      const token = loginData.access_token;
      console.log('Mobile App: Authentication successful');

      // 2. Dispatch message
      const isBulk = sendType === 'bulk';
      const endpoint = isBulk ? '/api/sms/send-bulk' : '/api/sms/send';
      const targetUrl = `${backendUrl.trim()}${endpoint}`;

      let payload: any = {
        deviceId: targetDeviceId.trim() || deviceId,
        content: sendMessageContent,
      };

      if (isBulk) {
        payload.recipients = sendRecipient
          .split(/[\n,]+/)
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
      } else {
        payload.recipient = sendRecipient.trim();
      }

      console.log('Mobile App: Sending dispatch payload to:', targetUrl);
      console.log('Payload:', JSON.stringify(payload));

      const dispatchResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const dispatchData = await dispatchResponse.json();

      if (dispatchResponse.ok) {
        setSmsStatus({
          success: true,
          message: isBulk
            ? `Bulk SMS enqueued successfully! Count: ${dispatchData.enqueuedCount || 0}`
            : 'Single SMS enqueued successfully!',
        });
        setSendRecipient('');
        setSendMessageContent('');
      } else {
        throw new Error(dispatchData.message || 'Failed to dispatch SMS.');
      }
    } catch (err: any) {
      console.warn('Error sending SMS from mobile app:', err.message);
      setSmsStatus({
        success: false,
        message: err.message || 'An error occurred.',
      });
    } finally {
      setSendingSms(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  // Connect WebSocket after device registers successfully
  useEffect(() => {
    if (registrationStatus === 'registered') {
      const wsService = new WebSocketService(wsUrl.trim(), deviceId);
      wsService.connect();

      const unsubscribe = wsService.onStateChange((connected) => {
        setIsConnected(connected);
      });

      return () => {
        unsubscribe();
        wsService.disconnect();
      };
    }
  }, [registrationStatus]);

  const allGranted = permissions.sms && permissions.phone && permissions.location;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>SMS Gateway</Text>
          <Text style={styles.subtitle}>Mobile Host App</Text>
        </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gateway Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, isConnected ? styles.bgOnline : styles.bgOffline]} />
          <Text style={styles.statusText}>
            {registrationStatus === 'unregistered' && 'Not Registered'}
            {registrationStatus === 'registering' && 'Registering Device...'}
            {registrationStatus === 'error' && 'Registration Error'}
            {registrationStatus === 'registered' && (isConnected ? 'Connected & Online' : 'Connecting WebSocket...')}
          </Text>
        </View>
      </View>

      {registrationStatus !== 'registered' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Registration Info</Text>

          <Text style={styles.inputLabel}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="e.g. http://10.0.2.2:3000"
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>WebSocket URL</Text>
          <TextInput
            style={styles.input}
            value={wsUrl}
            onChangeText={setWsUrl}
            placeholder="e.g. http://10.0.2.2:3000"
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Device ID</Text>
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="e.g. device_dev_1"
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.inputLabel}>Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g. Dev Simulator SIM1"
            placeholderTextColor="#8e8e93"
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={simPhoneNumber}
            onChangeText={setSimPhoneNumber}
            placeholder="e.g. +919876543210"
            keyboardType="phone-pad"
            placeholderTextColor="#8e8e93"
          />

          <Text style={styles.inputLabel}>Carrier Provider</Text>
          <TextInput
            style={styles.input}
            value={carrierProvider}
            onChangeText={setCarrierProvider}
            placeholder="e.g. Jio / Verizon"
            placeholderTextColor="#8e8e93"
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Required Permissions</Text>
        
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Send SMS</Text>
          <Text style={permissions.sms ? styles.textSuccess : styles.textDanger}>
            {permissions.sms ? 'Granted' : 'Required'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Read SIM Phone State</Text>
          <Text style={permissions.phone ? styles.textSuccess : styles.textDanger}>
            {permissions.phone ? 'Granted' : 'Required'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Fine Location (Signal Strength)</Text>
          <Text style={permissions.location ? styles.textSuccess : styles.textDanger}>
            {permissions.location ? 'Granted' : 'Required'}
          </Text>
        </View>
      </View>

      {!allGranted && (
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      )}

      {allGranted && registrationStatus !== 'registered' && (
        <TouchableOpacity 
          style={[styles.button, registrationStatus === 'registering' && styles.buttonDisabled]} 
          onPress={registerDevice}
          disabled={registrationStatus === 'registering'}
        >
          <Text style={styles.buttonText}>
            {registrationStatus === 'registering' ? 'Registering...' : 'Register Device'}
          </Text>
        </TouchableOpacity>
      )}

      {allGranted && registrationStatus === 'registered' && (
        <>
          <View style={styles.successBox}>
            <Text style={[styles.successText, { fontWeight: '700', marginBottom: 4 }]}>
              Registered ID: {deviceId}
            </Text>
            <Text style={[styles.successText, { fontWeight: '600', marginBottom: 4 }]}>
              {deviceName} ({simPhoneNumber})
            </Text>
            <Text style={styles.successText}>All systems active. Waiting for incoming SMS jobs...</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Send SMS Broadcast</Text>

            {smsStatus && (
              <View style={[styles.statusContainer, smsStatus.success ? styles.bgSuccessLight : styles.bgDangerLight]}>
                <Text style={smsStatus.success ? styles.textSuccess : styles.textDanger}>
                  {smsStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeButton, sendType === 'single' && styles.typeButtonActive]}
                onPress={() => {
                  setSendType('single');
                  setSendRecipient('');
                  setSmsStatus(null);
                }}
              >
                <Text style={[styles.typeButtonText, sendType === 'single' && styles.typeButtonTextActive]}>
                  Single Recipient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, sendType === 'bulk' && styles.typeButtonActive]}
                onPress={() => {
                  setSendType('bulk');
                  setSendRecipient('');
                  setSmsStatus(null);
                }}
              >
                <Text style={[styles.typeButtonText, sendType === 'bulk' && styles.typeButtonTextActive]}>
                  Bulk Recipients
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              {sendType === 'bulk' ? 'Recipients (Comma or line-separated)' : 'Recipient Phone Number'}
            </Text>
            <TextInput
              style={[styles.input, sendType === 'bulk' && styles.multilineInput]}
              value={sendRecipient}
              onChangeText={setSendRecipient}
              placeholder={sendType === 'bulk' ? '+916382289712, +919876543210' : 'e.g. +916382289712'}
              placeholderTextColor="#8e8e93"
              keyboardType={sendType === 'single' ? 'phone-pad' : 'default'}
              multiline={sendType === 'bulk'}
              numberOfLines={sendType === 'bulk' ? 3 : 1}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Target Device ID</Text>
            <TextInput
              style={styles.input}
              value={targetDeviceId}
              onChangeText={setTargetDeviceId}
              placeholder="Target device ID to route the SMS"
              placeholderTextColor="#8e8e93"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Message Content</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={sendMessageContent}
              onChangeText={setSendMessageContent}
              placeholder="Type your message text here..."
              placeholderTextColor="#8e8e93"
              multiline
              numberOfLines={4}
            />

            {/* Auth Settings Toggle */}
            <TouchableOpacity 
              style={styles.authToggle} 
              onPress={() => setShowAuthSettings(!showAuthSettings)}
            >
              <Text style={styles.authToggleText}>
                {showAuthSettings ? 'Hide API Credentials ▲' : 'Show API Credentials ▼'}
              </Text>
            </TouchableOpacity>

            {showAuthSettings && (
              <View style={styles.authPanel}>
                <Text style={styles.inputLabel}>Admin Email</Text>
                <TextInput
                  style={styles.input}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="admin@example.com"
                  placeholderTextColor="#8e8e93"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputLabel}>Admin Password</Text>
                <TextInput
                  style={styles.input}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="securepassword"
                  placeholderTextColor="#8e8e93"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, (sendingSms || !sendRecipient || !sendMessageContent) && styles.buttonDisabled]}
              onPress={handleMobileSendSms}
              disabled={sendingSms || !sendRecipient || !sendMessageContent}
            >
              <Text style={styles.buttonText}>
                {sendingSms ? 'Enqueuing...' : sendType === 'bulk' ? 'Queue Bulk SMS' : 'Queue Single SMS'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#8e8e93',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    color: '#aeaeb2',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  bgOnline: {
    backgroundColor: '#34c759',
  },
  bgOffline: {
    backgroundColor: '#ff3b30',
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  permissionLabel: {
    color: '#e5e5ea',
    fontSize: 16,
  },
  textSuccess: {
    color: '#34c759',
    fontWeight: '600',
  },
  textDanger: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007aff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#3a3a3c',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#34c759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  successText: {
    color: '#34c759',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  inputLabel: {
    color: '#aeaeb2',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bgSuccessLight: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#34c759',
  },
  bgDangerLight: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#007aff',
  },
  typeButtonText: {
    color: '#aeaeb2',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  authToggle: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  authToggleText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '600',
  },
  authPanel: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
});

export default App;
