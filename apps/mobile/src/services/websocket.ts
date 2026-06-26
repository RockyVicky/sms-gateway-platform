import { io, Socket } from 'socket.io-client';
import { NativeModules } from 'react-native';

const { SmsModule } = NativeModules;

export interface ConnectionStateListener {
  (connected: boolean): void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private deviceId: string;
  private url: string;
  private stateListeners: Set<ConnectionStateListener> = new Set();

  constructor(url: string, deviceId: string) {
    this.url = url;
    this.deviceId = deviceId;
  }

  // Subscribe to connection state changes
  onStateChange(listener: ConnectionStateListener) {
    this.stateListeners.add(listener);
    // Initial call
    listener(this.socket?.connected || false);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners(connected: boolean) {
    this.stateListeners.forEach(listener => listener(connected));
  }

  connect() {
    if (this.socket) {
      return;
    }

    console.log(`Connecting to WebSocket Gateway: ${this.url}`);
    
    this.socket = io(this.url, {
      transports: ['websocket'],
      auth: {
        deviceId: this.deviceId,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to gateway server');
      this.notifyListeners(true);
      this.startHeartbeat();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from gateway server');
      this.notifyListeners(false);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      this.notifyListeners(false);
    });

    // Handle SMS Send Command
    this.socket.on('sms:send', async (data: { messageId: string; recipient: string; content: string }) => {
      console.log(`SMS Send Command Received: ${JSON.stringify(data)}`);
      
      try {
        if (!SmsModule) {
          throw new Error('SmsModule is not registered in the native runtime.');
        }

        console.log(`Dispatching native SMS via SIM card to: ${data.recipient}`);
        await SmsModule.sendSms(data.recipient, data.content);
        console.log('Native SMS sent successfully');

        if (this.socket && this.socket.connected) {
          this.socket.emit('sms:status', {
            messageId: data.messageId,
            status: 'sent',
            error: null,
          });
          console.log(`Reported SMS status back to server: ${data.messageId} - sent`);
        }
      } catch (err: any) {
        console.warn('Failed to send SMS via native module:', err.message);
        if (this.socket && this.socket.connected) {
          this.socket.emit('sms:status', {
            messageId: data.messageId,
            status: 'failed',
            error: err.message || 'Failed to dispatch via carrier network',
          });
          console.log(`Reported SMS status back to server: ${data.messageId} - failed`);
        }
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        // Mock metrics for battery and signal
        const battery = 92;
        const signal = 4; // Max strength
        
        this.socket.emit('heartbeat', { battery, signal });
        console.log(`Heartbeat sent. Battery: ${battery}%, Signal: ${signal}`);
      }
    }, 15000); // 15s interval for testing/dev (60s in production)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
