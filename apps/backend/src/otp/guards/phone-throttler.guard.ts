import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PhoneThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If the request body contains a phone number, use it as the tracker key
    if (req.body && typeof req.body.phone === 'string') {
      const cleanPhone = req.body.phone.trim();
      return `throttle:phone:${cleanPhone}`;
    }
    // Fallback to client IP
    return req.ip;
  }
}
