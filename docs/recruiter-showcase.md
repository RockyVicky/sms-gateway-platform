# Recruiter Showcase & Portfolio Presentation Guide

This guide is structured to help you present the SMS Gateway SaaS Platform during technical screenings, system design interviews, and architectural panels. It highlights complex design trade-offs, scalability calculations, and core engineering challenges.

---

## 🎙️ The Elevator Pitch

> *"I designed and built a self-hosted SMS Gateway SaaS monorepo that turns Android smartphones into physical SMS relay nodes. By deploying a React Native background daemon on local devices and coupling it with a containerized NestJS/Redis backend, businesses can send transactional text messages and OTPs using direct cellular SIM cards for a fraction of the cost of traditional API aggregators. The platform processes high-throughput traffic using Redis-backed queues (BullMQ), limits send rates to comply with carrier terms, and maintains real-time socket connections to monitor device battery and signal telemetry."*

---

## 💼 Business Problem Solved

Traditional transactional SMS providers (like Twilio or AWS SNS) charge high rates per message (often $0.0075+ per SMS in the US and comparable premiums globally). This becomes prohibitively expensive for startups or enterprises sending millions of verification codes or alerts per month. 

Conversely, local mobile carriers offer consumer or business SIM packages containing thousands of "free" or low-cost SMS messages per month. 

This platform bridges that gap:
- **Cost Minimization**: Cuts SMS dispatch costs by up to 90% by redirecting traffic to local SIM cards.
- **Independence**: Removes reliance on third-party aggregators and international routing.
- **Physical Node Control**: Leverages legacy or cheap Android phones as decentralized hardware nodes.

---

## 🛠️ Deep Technical Challenges & Solutions

### Challenge 1: Metro Bundler Symlink Issues in Monorepos
* **Problem**: In an NPM Workspaces monorepo, dependencies are hoisted to the root `node_modules`. React Native's Metro bundler does not natively support symlinks or lookups outside the app subfolder, causing "module not found" or "duplicate React instances" runtime crashes.
* **Solution**: I customized `metro.config.js` to define explicit `watchFolders` mapping back to the monorepo root. Additionally, I configured resolver blockings (`extraNodeModules`) to redirect requests for React and React Native to a single, concrete local path, preventing multiple instance conflicts.

### Challenge 2: Background Service Lifespans on Android
* **Problem**: Modern Android OS builds (Android 10+) aggressively kill background WebSocket connections and threads to optimize battery life (Doze Mode).
* **Solution**: I implemented a persistent foreground service wrapper in the React Native client. By requesting `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permissions and maintaining a native Android `Wakelock` while connected to the Socket.io gateway, the app maintains stable TCP sockets even when the phone screen is locked.

### Challenge 3: SMS Dispatch Carrier Suspension
* **Problem**: Mobile carriers scan for spam activities. If a SIM card sends 20 messages in rapid succession (bursts), the carrier immediately flags and suspends the phone line.
* **Solution**: I configured BullMQ workers with strict rate-limiting parameters (`limiter: { max: 1, duration: 2000 }`). Regardless of how many requests hit the NestJS REST API, the queue guarantees a 2-second spacing interval between messages dispatched to a specific device, keeping the SIM within compliance guidelines.

---

## 📐 Architecture & System Design Trade-Offs

### 1. WebSockets vs. HTTP Polling for Devices
* **Choice**: Socket.io (WebSockets) over HTTP long-polling.
* **Trade-off**: WebSockets require stateful memory allocations on the backend server to maintain TCP connections. However, HTTP polling would introduce massive database read overhead and delivery latency (5–10 seconds). Stateful WebSockets reduce SMS delivery latency down to **sub-500ms** from ingestion to phone receipt.

### 2. BullMQ (Redis) vs. RabbitMQ / Kafka
* **Choice**: BullMQ on Redis.
* **Trade-off**: While RabbitMQ and Kafka offer complex routing and massive scale, they add significant operational overhead (zookeeper/kraft, clustering, configuration files). Redis was already required for fast session caching and socket registry. Utilizing BullMQ allowed me to build an ACID-compliant queue with minimal overhead while supporting exponential backoff, rate limiting, and jobs status tracking.

### 3. MongoDB (Mongoose) vs. PostgreSQL
* **Choice**: MongoDB.
* **Trade-off**: A relational database like PostgreSQL is excellent for transactional relations. However, SMS telemetry payloads and device metrics are highly polymorphic (different carrier metadata, native Android codes, battery state logs). MongoDB's document model allows structured log storage without migrations while maintaining high-speed write throughput.

---

## 🔒 Security Hardening Decisions

1. **Dual-Guard Authorization**: 
   * Administrators use a secure Passport-JWT cookie session flow with CSRF protection.
   * Programmatic clients bypass cookies and authenticate via custom `x-api-key` headers.
2. **SHA-256 Key Hashing**: Plaintext API Keys are never stored in the database. When keys are created, they are displayed once, and only their SHA-256 hash is saved.
3. **Phone-Level OTP Throttler**: Standard IP rate limiters are bypassed using proxies. I wrote a custom NestJS `PhoneThrottlerGuard` that tracks OTP counts by phone number in the request body, blocking spam requests to a phone to a maximum of 3 requests per 5 minutes.

---

## 💬 Interview Talking Points by Role

### For Full-Stack Roles:
* Focus on the React-to-Android pipeline. Explain how state changes in the React dashboard flow through the NestJS WebSocket gateway to trigger native Android Kotlin modules.

### For Backend / Platform Roles:
* Explain the Redis/BullMQ concurrency architecture, worker rate-limiting, and error-handling strategies. Mention the custom phone rate-limiting guard and structured Pino JSON log format optimized for ELK/Datadog.

### For Systems & Security Roles:
* Detail the SHA-256 API key hashing, JWT token lifecycle, CSRF protection, and foreground wakelock persistence patterns on the Android client.
