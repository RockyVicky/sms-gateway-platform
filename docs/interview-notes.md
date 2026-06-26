# System Architecture Interview Notes (Senior Full-Stack Developer Prep)

This document contains detailed explanations of the architectural choices, system limits, security models, and scaling strategies implemented in this project, designed as preparation material for Senior / Staff Engineer technical interviews.

---

## 1. Technological Selection Rationale

### Why Redis?
* **In-Memory Speed**: Redis runs in-memory with O(1) read/write lookups, making it the perfect coordination hub for ephemeral queue states, rate-limit counters, and active session buffers.
* **Pub/Sub Capabilities**: Enables seamless vertical and horizontal event broadcasting across decoupled API pods.
* **Low Footprint**: Has minimal latency overhead compared to using disk-bound relational databases for lock states and job states.

### Why BullMQ?
* **Decoupled Architecture**: BullMQ handles queue operations asynchronously outside of the primary HTTP request/response thread, keeping NestJS connections free to ingest traffic.
* **Guaranteed Delivery & Backoff**: Supports automatic retry policies with exponential backoff configurations, preventing message loss when target Android gateways briefly go offline.
* **Advanced Throttling**: Features built-in job concurrency settings and rate-limiters (`limiter: { max, duration }`) that are essential to enforce cellular carrier compliance (e.g. max 1 message / 2 seconds).

### Why Socket.io (WebSockets)?
* **Bi-Directional Persistence**: Unlike HTTP polling, a single persistent TCP connection allows the server to instantly push SMS commands (`sms:send`) to client devices and receive immediate status callbacks.
* **Automatic Reconnects**: Built-in heartbeat detection and auto-reconnection filters manage mobile cellular drops (e.g. transition from Wi-Fi to LTE) seamlessly.
* **Multiplexing / Rooms**: Easily clusters devices into custom WebSocket rooms (e.g. per-user or per-carrier groups) to manage targeting.

---

## 2. Scalability and High-Availability Strategy

### How do we scale the backend horizontally?
* **The Problem**: A standard Socket.io gateway maps socket connections to local server memory. If we run 3 instances of our NestJS backend behind an Nginx/ALB load balancer, a client device connected to Node A cannot be reached by a message worker running on Node B.
* **The Solution**:
  1. Configure the **Redis Adapter** (`@socket.io/redis-adapter`) on all Socket.io gateway instances. This connects all nodes via Redis Pub/Sub. When Node B emits `sms:send` to a socket, the Redis adapter broadcasts it across all nodes, reaching the device on Node A.
  2. Implement **Sticky Sessions** on the load balancer (e.g., Nginx or AWS ALB) using cookie hashes. This ensures that the initial HTTP handshake of a socket upgrade connection consistently targets the same node.

### How do we handle database scaling?
* **Mongoose Indexing**: Applied single-field compound-ready indexes on critical query paths:
  - `messages`: Indexed `{ recipient: 1 }`, `{ status: 1 }`, `{ deviceId: 1 }`, and `{ createdAt: -1 }` (for pagination).
  - `devices`: Indexed `{ deviceId: 1 }`, `{ status: 1 }`, and `{ phoneNumber: 1 }`.
* **Database Partitioning**: As the message logs scale to millions of entries, implement MongoDB **sharding** using `userId` or `createdAt` as the shard key, splitting write loads across multiple database shards.

---

## 3. Production Security Architecture

### Authentication & Authorizations
* **Double Guard Pipeline**: Implement `UnifiedAuthGuard` supporting:
  - **JWT Bearer Tokens** (for UI sessions): Short-lived tokens backed by secure HTTPOnly cookie/local storages, with refresh tokens saved in MongoDB to enable session rotation.
  - **Hashed API Keys** (for developer integrations): Clients pass API keys in the `x-api-key` header. The database only stores a cryptographic SHA-256 hash of the key (`keyHash`), ensuring that if the database is leaked, raw API keys remain safe.

### Attack Vector Mitigations
* **OTP Spam/Exhaustion Protection**: Configured custom `PhoneThrottlerGuard` which extracts the phone number from the request body. If a single phone number requests more than 3 OTPs within 5 minutes, it is blocked, protecting the owner's SIM card balance from script abuse.
* **API Key Rate Limiting**: General API endpoints are protected using a global `ThrottlerGuard` limiting connections per IP to prevent DDoS/flooding.

---

## 4. Mobile Gateway Design & Native Integration

### Custom Android Native Telephony Bridge
* **Why not use existing libraries?**: Standard packages do not expose raw SIM control or multi-SIM slot allocation parameters needed for an enterprise SaaS platform.
* **Implementation**: Wrote a custom Kotlin native module (`SmsModule`) extending `ReactContextBaseJavaModule` to bind React Native directly to `android.telephony.SmsManager`. 
* **Keystore Encryption**: Device authentication keys (RSA key pairs) are generated inside the Android **Keystore System**, preventing private keys from being extracted or read by other applications on the system.

### Background Service Resiliency
* **Wakelocks & Doze Mode**: Android's battery-saving features (Doze Mode) will put the WebSocket connection to sleep. The mobile client implements an Android **Foreground Service** with an active notification drawer icon. This informs the OS that the app is performing active work, preventing process termination.
