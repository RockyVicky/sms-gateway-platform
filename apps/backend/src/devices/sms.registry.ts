import { Injectable } from '@nestjs/common';

interface PendingMessage {
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
}

@Injectable()
export class SmsRegistry {
  private registry = new Map<string, PendingMessage>();

  register(
    messageId: string,
    resolve: (value: boolean) => void,
    reject: (reason: Error) => void,
    ttlMs: number = 60000,
  ) {
    this.clear(messageId);

    const timeout = setTimeout(() => {
      const pending = this.registry.get(messageId);
      if (pending) {
        pending.reject(
          new Error(
            'SMS dispatch timeout: device failed to acknowledge within 60s',
          ),
        );
        this.registry.delete(messageId);
      }
    }, ttlMs);

    this.registry.set(messageId, { resolve, reject, timeout });
  }

  resolve(messageId: string): boolean {
    const pending = this.registry.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(true);
      this.registry.delete(messageId);
      return true;
    }
    return false;
  }

  reject(messageId: string, errorMsg: string): boolean {
    const pending = this.registry.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(errorMsg));
      this.registry.delete(messageId);
      return true;
    }
    return false;
  }

  clear(messageId: string) {
    const pending = this.registry.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.registry.delete(messageId);
    }
  }
}
