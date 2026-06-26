# System Architecture and Design Specification

This document provides a technical deep-dive into the architectural designs, database schemas, message lifecycles, and real-time flows of the SMS Gateway SaaS Platform.

---

## 1. Component Architecture Overview

The system is designed as a distributed, event-driven monorepo split into decoupled services:

```mermaid
graph TD
    subgraph Client Application
        SDK[API Client / Third-party App]
    end

    subgraph Node.js Gateway Layer (Docker Cluster)
        Caddy[Caddy Reverse Proxy]
        API[NestJS HTTP Server]
        WS[Socket.io Gateway]
    end

    subgraph Messaging Queue & Storage
        Redis[(Redis Key-Value Cache)]
        BullMQ[BullMQ Processing Engine]
        DB[(MongoDB Database)]
    end

    subgraph Android Endpoint Nodes
        App[React Native Daemon]
        SIM[Physical SIM Card]
    end

    SDK -- HTTP/JSON requests --> Caddy
    Caddy -- Port 3000 /api --> API
    Caddy -- Port 3000 /socket.io --> WS
    
    API -- Read/Write --> DB
    API -- Push SMS Job --> BullMQ
    BullMQ -- Store State --> Redis
    
    WS -- Emits 'sms:send' --> App
    App -- Reports 'sms:status' --> WS
    App -- Telephony Access --> SIM
```

---

## 2. Database Design (MongoDB Schemas)

The database layers are modeled in MongoDB using Mongoose schemas. The critical collections and their relations are detailed below:

### `users` Collection
Stores admin/user credentials and authorization roles:
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (Unique, Indexed)",
  "passwordHash": "String",
  "role": "String (admin | user)",
  "refreshTokens": ["String"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `devices` Collection
Keeps track of registered Android device gateways, hardware IDs, and live socket connection references:
```json
{
  "_id": "ObjectId",
  "deviceId": "String (Unique, Indexed)",
  "name": "String",
  "phoneNumber": "String (E.164 format)",
  "provider": "String (e.g. Jio)",
  "status": "String (online | offline | paused)",
  "battery": "Number (0-100)",
  "signal": "Number (0-4)",
  "socketId": "String (Nullable, Indexed)",
  "publicKey": "String (RSA Public Key)",
  "lastSeenAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `messages` Collection
Tracks every inbound/outbound SMS transactional request:
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Ref: users, Indexed)",
  "deviceId": "String (Ref: devices, Nullable, Indexed)",
  "recipient": "String (E.164 format, Indexed)",
  "content": "String",
  "status": "String (pending | queued | processing | sent | failed, Indexed)",
  "errorMessage": "String (Nullable)",
  "attempts": "Number (Default: 0)",
  "maxAttempts": "Number (Default: 3)",
  "sentAt": "Date (Nullable)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `otp_requests` Collection
Stores OTP requests for phone verification:
```json
{
  "_id": "ObjectId",
  "phone": "String (Indexed)",
  "otpHash": "String (SHA-256)",
  "expiresAt": "Date (Indexed)",
  "attempts": "Number (Default: 0)",
  "verified": "Boolean (Default: false)",
  "createdAt": "Date"
}
```

---

## 3. Message Lifecycle & Queue Processing (BullMQ)

Message sending is asynchronous and managed via [BullMQ](https://github.com/taskforcesh/bullmq) to ensure reliability.

```mermaid
stateDiagram-v2
    [*] --> Pending : POST /api/sms/send
    Pending --> Queued : Push Job to BullMQ
    Queued --> Processing : Dequeued by Worker
    
    state Processing {
        [*] --> CheckDeviceStatus
        CheckDeviceStatus --> DeviceOffline : Socket Missing
        CheckDeviceStatus --> DeviceOnline : Emit websocket 'sms:send'
        DeviceOnline --> AwaitingCallback : Start Registry Timer
    }

    DeviceOffline --> Failed : Max Attempts Reached
    DeviceOffline --> Queued : Retry Delayed (e.g. 30s)
    
    AwaitingCallback --> Sent : Received 'sms:status' (success)
    AwaitingCallback --> Failed : Timeout / 'sms:status' (error)
    
    Sent --> [*]
    Failed --> [*]
```

### Queue Processing Flow
1. **Request Ingestion**: The client calls `POST /api/sms/send`. The NestJS controller validates inputs and creates a database document with `status: pending`.
2. **Enqueue**: The backend pushes an execution job containing the database `messageId` into the BullMQ Redis queue. The document status transitions to `status: queued`.
3. **Queue Worker Execution**: The active background worker pops the job and changes the database status to `processing`.
4. **WebSocket Dispatch**: The worker checks the active socket maps in `DevicesGateway`.
   * **If Device is Online**: The server registers a pending callback in `SmsRegistry` and emits an `sms:send` event over the device's WebSocket.
   * **If Device is Offline**: The worker throws an exception, prompting BullMQ to mark the job as failed and schedule a delayed retry.

---

## 4. WebSocket Communication Flow

Real-time device synchronization uses Socket.io to manage client presence and status updates:

```mermaid
sequenceDiagram
    participant Device as React Native App
    participant GW as NestJS WebSockets Gateway
    participant DB as MongoDB
    
    Note over Device,GW: Connection & Heartbeat
    Device->>GW: Connect (deviceId, query/auth)
    GW->>DB: Check if Device exists
    DB-->>GW: Device found
    GW-->>Device: Connection Accepted
    GW->>DB: Update device socketId, status = 'online'
    
    loop Every 15 seconds
        Device->>GW: Emit 'heartbeat' { battery: 90, signal: 4 }
        GW->>DB: Update battery, signal, and lastSeenAt
    end

    Note over Device,GW: SMS Dispatch Callback
    GW->>Device: Emit 'sms:send' { messageId, recipient, content }
    Note right of Device: App calls android.telephony.SmsManager
    Device-->>GW: Emit 'sms:status' { messageId, status: 'sent'/'failed' }
    GW->>DB: Update message status and sentAt
```

---

## 5. Device Registration Flow

```mermaid
sequenceDiagram
    participant Admin as Admin Dashboard
    participant API as NestJS API
    participant DB as MongoDB
    
    Admin->>API: POST /api/devices/register { deviceId, name, phoneNumber, provider, publicKey }
    API->>DB: Check if deviceId already registered
    alt Not Registered
        API->>DB: Save Device (status = 'offline')
        API-->>Admin: Device Registered Successfully (201 Created)
    else Already Registered
        API->>DB: Update device info (name, provider, publicKey)
        API-->>Admin: Device Updated Successfully (200 OK)
    end
```

---

## 6. OTP Verification Flow

OTP generation uses cryptographic hashing to protect numeric secrets:

```mermaid
sequenceDiagram
    participant User as Client App
    participant API as NestJS API
    participant SMS as BullMQ Queue
    participant DB as MongoDB

    Note over User,API: OTP Generation
    User->>API: POST /api/otp/send { phone }
    API->>API: Generate 6-digit numeric OTP (e.g. 523194)
    API->>API: Hash OTP (SHA-256)
    API->>DB: Invalidate previous OTPs for phone
    API->>DB: Save new OtpRequest { phone, otpHash, expiresAt }
    API->>SMS: Enqueue SMS job: "Your OTP is 523194..."
    API-->>User: OTP dispatched successfully
    
    Note over User,API: OTP Verification
    User->>API: POST /api/otp/verify { phone, otp: "523194" }
    API->>API: Hash input "523194" -> inputHash
    API->>DB: Retrieve active OTP request for phone
    alt Not Found / Expired
        API-->>User: Throw BadRequestException (OTP invalid/expired)
    else Attempts >= 3
        API-->>User: Throw BadRequestException (Limit exceeded)
    else Hash Match Fail
        API->>DB: Increment attempts count
        API-->>User: Throw BadRequestException (Invalid OTP)
    else Hash Match Success
        API->>DB: Set verified = true
        API-->>User: Return success (OTP verified)
    end
```

---

## 7. Failure Recovery and Retries

The platform implements multi-layer recovery paths to handle common network and hardware failures:

### 1. WebSockets Gateway Disconnection
* **Action**: If a device socket drops, Socket.io client in [App.tsx](file:///e:/Autonomous/files/message-service/apps/mobile/App.tsx) initiates exponential backoff reconnect attempts.
* **Database Sync**: The backend logs the socket disconnect event and marks the device status as `offline`.

### 2. Message Timeout (No Callback Received)
* **Action**: When a job is dispatched to a device, the backend initiates a 30-second callback registry timer (`SmsRegistry`).
* **Trigger**: If the device fails to report back within 30 seconds (due to app crash, memory pressure, or battery exhaustion), the registry rejects the timer.
* **Resolution**: The worker marks the message status as `failed` in the database, triggering a retry event inside BullMQ.

### 3. SIM Carrier Failures (Out of Credits/No Signal)
* **Action**: If the Android native SMS manager fails to send the text message, the app catches the exception and returns `status: failed` containing the carrier's error code.
* **Resolution**: The backend logs the error inside the `errorMessage` column, and BullMQ schedules a retry with a 30-second delay. The system attempts up to 3 retries before marking the message as permanently `failed`.
