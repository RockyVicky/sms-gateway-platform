# High-Level Architecture

The SMS Gateway SaaS Platform is structured as a distributed, decoupled system designed to bridge web-based application requests with physical GSM transmission devices.

```mermaid
graph TB
    subgraph Client Application Layer
        SDK[Third-Party REST SDK / Client App]
        User[Dashboard Web App Client]
    end

    subgraph API Gateway & Reverse Proxy
        Caddy[Caddy Reverse Proxy]
    end

    subgraph Service Layer (Docker Network)
        API[NestJS HTTP Backend Server]
        WS[Socket.io WebSockets Gateway]
    end

    subgraph Asynchronous Processing & Cache
        Redis[(Redis Cache & PubSub)]
        Queue[BullMQ Message Queue]
    end

    subgraph Database Layer
        DB[(MongoDB Database)]
    end

    subgraph Remote Host Gateway Nodes
        App[React Native Daemon]
        Native[Android Native SmsManager]
        SIM[Physical SIM Card]
    end

    %% Communications
    SDK -- "POST /api/sms/send (x-api-key)" --> Caddy
    User -- "HTTPS (JWT Cookies)" --> Caddy
    Caddy -- "Proxy Port 3000 /api" --> API
    Caddy -- "Proxy Port 3000 /socket.io" --> WS

    API -- "Create SMS Record (status: pending)" --> DB
    API -- "Push SMS payload" --> Queue
    Queue -- "Enqueue/Dequeue Jobs" --> Redis
    Queue -- "Read Job" --> API

    API -- "Select Socket & Emit 'sms:send'" --> WS
    WS -- "Persistent WebSocket Connection" --> App
    App -- "Bridge JS calls" --> Native
    Native -- "GSM Broadcast" --> SIM
    SIM -- "SMS Network" --> Recipient([Recipient Mobile Phone])

    App -- "Acknowledge Send 'sms:status'" --> WS
    WS -- "Update SMS status (sent/failed)" --> DB
```

### Key Components

1. **Caddy Reverse Proxy**: Handles SSL termination, routes API requests to the NestJS cluster, and static dashboard assets.
2. **NestJS API Server**: Standard REST framework managing auth, OTP hashing, and SMS ingestion.
3. **BullMQ / Redis**: Asynchronous queue processor. Ensures messages are not lost during peak traffic and manages carrier compliance rate limiting.
4. **Socket.io WebSockets Gateway**: Keeps open sockets to registered Android daemons, monitoring device metrics (battery, network signal) and pushing outbound SMS tasks.
5. **React Native Android Client**: Native Java wrapper running as a background service, utilizing Android's `SmsManager` to physically trigger SIM cards.
