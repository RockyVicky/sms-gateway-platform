# OTP Verification Flow

Secure, rate-limited One-Time Password generation, delivery, and verification.

```mermaid
sequenceDiagram
    autonumber
    actor User as Mobile/Web User
    participant App as Client Application
    participant Backend as NestJS API Server
    participant DB as MongoDB Database
    participant Queue as BullMQ (Redis)

    User->>App: Click "Request OTP" for phone number
    App->>Backend: POST /api/otp/send { phone }
    activate Backend
    
    Note over Backend: Custom rate limiter checking (Max 3 OTPs / 5 mins per phone)
    Backend->>Backend: Evaluate PhoneThrottlerGuard
    alt Limit exceeded
        Backend-->>App: Throw 429 Too Many Requests
    end

    Backend->>Backend: Generate cryptographically secure 6-digit OTP (e.g., "734291")
    Backend->>Backend: Hash OTP using SHA-256 (otpHash)
    Backend->>DB: Invalidate previous active OTPs for this phone number
    Backend->>DB: Save OtpRequest { phone, otpHash, expiresAt: Date.now() + 5 min, attempts: 0, verified: false }
    Backend->>Queue: Push SMS Dispatch job: "Your verification code is: 734291. Exp 5m."
    Backend-->>App: Return 200 OK { message: "OTP sent" }
    deactivate Backend

    Note over User,App: User receives SMS and inputs the 6-digit code
    User->>App: Input "734291"
    App->>Backend: POST /api/otp/verify { phone, code: "734291" }
    activate Backend
    Backend->>Backend: Hash input "734291" using SHA-256 (inputHash)
    Backend->>DB: Query OtpRequest where phone = phone and verified = false
    DB-->>Backend: Return OtpRequest
    
    alt OtpRequest is null OR expiresAt < Date.now()
        Backend-->>App: Throw 400 Bad Request (Code expired/invalid)
    else OtpRequest.attempts >= 3
        Backend-->>App: Throw 400 Bad Request (Max verification attempts exceeded)
    else inputHash != OtpRequest.otpHash
        Backend->>DB: Increment OtpRequest.attempts by 1
        Backend-->>App: Throw 400 Bad Request (Incorrect code)
    else inputHash == OtpRequest.otpHash
        Backend->>DB: Update OtpRequest: verified = true
        Backend-->>App: Return 200 OK { verified: true, message: "OTP verified successfully" }
    end
    deactivate Backend
```

### Flow Highlights

- **Brute-Force Shielding**: Storing attempts and limiting verification tries to 3 per code prevents automated script attacks guessing the OTP.
- **SHA-256 OTP Hash Storage**: We do not store raw 6-digit codes in the database, protecting user session logs in the event of database access breaches.
- **PhoneThrottlerGuard**: Prevents SIM flooding and SMS bill exhaustion by rate-limiting OTP triggers using the phone number body parameter instead of IP addresses.
