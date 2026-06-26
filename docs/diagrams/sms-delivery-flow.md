# SMS Delivery Flow

The sequence of operations required to send a text message from a client API call down to the physical SIM transmission.

```mermaid
sequenceDiagram
    autonumber
    actor Client as API Client / Developer
    participant Backend as NestJS API Server
    participant DB as MongoDB Database
    participant Queue as BullMQ (Redis)
    participant WS as WebSockets Gateway
    participant Mobile as React Native Host App
    participant Tel as Android SmsManager

    Client->>Backend: POST /api/sms/send { recipient, content } (x-api-key)
    activate Backend
    Backend->>Backend: Validate payload & API Key
    Backend->>DB: Create message document (status = "pending")
    DB-->>Backend: Return messageId
    Backend->>Queue: Push Job { messageId, recipient, content }
    Backend->>DB: Update status = "queued"
    Backend-->>Client: Return 202 Accepted { messageId, status: "queued" }
    deactivate Backend

    Note over Queue,Backend: Asynchronous Dequeue (Worker rate-limited: 1 SMS every 2s per device)
    activate Queue
    Queue-->>Backend: Dequeue job
    deactivate Queue
    activate Backend
    Backend->>DB: Update status = "processing"
    Backend->>WS: Query active socket connection for target deviceId
    
    alt Device is online
        WS->>Mobile: Emit "sms:send" { messageId, recipient, content }
        activate Mobile
        Mobile->>Tel: Call SmsManager.sendTextMessage(...)
        Tel-->>Mobile: Broadcast success/failure callbacks
        Mobile->>WS: Emit "sms:status" { messageId, status: "sent", errorMessage: null }
        deactivate Mobile
        WS->>Backend: Forward socket notification
        Backend->>DB: Update status = "sent", sentAt = Date.now()
    else Device is offline
        Backend->>DB: Update status = "failed", errorMessage = "Device offline"
        Backend->>Queue: Trigger job retry (exponential backoff)
    end
    deactivate Backend
```

### Flow Highlights

- **HTTP Status 202 Accepted**: Immediately returned to the developer to avoid blockings. The SMS delivery is processed out-of-band.
- **Worker Level Rate Limiting**: Ensures that even under peak traffic, the queue worker delays dispatching to the WebSockets gateway to match the 2-second rate limit, avoiding carrier flags.
- **Bidirectional WebSocket Update**: Real-time status update feeds back from Android's hardware listener directly to the dashboard records.
