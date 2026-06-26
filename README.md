# SMS Gateway SaaS Platform: Self-Hosted Direct-to-SIM Messaging Infrastructure

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android-orange.svg)]()
[![NestJS](https://img.shields.io/badge/backend-NestJS%20v11-red.svg)]()
[![React](https://img.shields.io/badge/dashboard-React%20v19-blue.svg)]()
[![React Native](https://img.shields.io/badge/client-React%20Native%20v0.86-cyan.svg)]()

A high-performance, self-hosted SMS Gateway SaaS platform that turns Android devices into physical SMS relay nodes. The platform enables developers and businesses to dispatch low-cost transaction messages (OTP, alerts, notifications) using local carrier SIM cards (such as Jio) instead of expensive third-party SMS providers like Twilio.

The project is structured as a production-grade TypeScript **monorepo** featuring robust queueing, real-time WebSocket links, dynamic analytics, and automatic TLS containerized deployment.

---

## 🏗️ System Architecture

This platform consists of three core workloads and a shared packaging layer:

```mermaid
flowchart TD
    subgraph Client Application / Developer
        API_Call[REST API / SDK Client]
    end

    subgraph Server Stack (Docker Compose VPS)
        Backend[NestJS API Server]
        DB[(MongoDB Database)]
        Queue[BullMQ Redis Queue]
        Websocket[Socket.io Gateway]
        Caddy[Caddy Reverse Proxy]
    end

    subgraph Client Node (Physical Android Device)
        App[React Native Daemon]
        Native[Android Native SmsManager]
        SIM[Physical SIM Card]
    end

    API_Call -- Send SMS / OTP --> Caddy
    Caddy -- Proxy requests --> Backend
    Backend -- Save records --> DB
    Backend -- Push Job --> Queue
    Queue -- Dequeue & dispatch --> Websocket
    Websocket -- Emits 'sms:send' event --> App
    App -- Bridge call --> Native
    Native -- Sideload message --> SIM
    SIM -- GSM Transmission --> Recipient([Recipient Mobile Phone])

    App -- Emits status update 'sms:status' --> Websocket
    Websocket -- Update status --> DB
```

For a detailed breakdown of schemas, state transitions, and background wakelocks, see the [System Architecture Documentation](./docs/architecture.md).

---

## ✨ Key Features

* **Direct SIM Card Relay**: Bypasses SMS API aggregators by using native Android telephony API libraries on physical SIM cards.
* **Robust Message Queueing**: Employs [BullMQ](https://github.com/taskforcesh/bullmq) (backed by Redis) to prevent message drops and handle spikes in throughput gracefully.
* **Real-Time Device Synchrony**: Employs a Socket.io WebSocket link to handle persistent device connectivity, active socket registry, and live device telemetry.
* **Live Analytics Dashboard**: React dashboard utilizing Recharts to track delivery statistics, OTP ratios, active device signals, and battery states in real-time.
* **OTP Generation & Verification**: Ready-made endpoints featuring automatic 5-minute code expiration, 3-attempt brute-force protection, and phone-level rate limits.
* **Automatic Failure Recovery**: Immediate retry patterns on failure to send, and queue persistence in the event that devices temporarily lose signal.
* **Structured JSON Logging**: Integrates Pino for production-grade structured JSON output, ready for Datadog, ELK, or CloudWatch ingestion.
* **Containerized Deployment**: Clean Caddy proxy configuration with automated HTTPS SSL provisioning and persistent volumes.

---

## 🛠️ Technology Stack

| Workload / Component | Technology Stack |
| :--- | :--- |
| **Monorepo Engine** | NPM Workspaces, TypeScript (Strict Mode) |
| **Backend API Server** | NestJS v11, Express, Passport JWT, Mongoose, Pino Logger |
| **Message Queue & Cache** | Redis, BullMQ |
| **Real-time Gateway** | Socket.io (`@nestjs/websockets` & `@nestjs/platform-socket.io`) |
| **Frontend Dashboard** | React v19, Vite, Material UI (MUI v6), TanStack React Query, Recharts |
| **Mobile Gateway Daemon** | React Native v0.86, Android Native Java Modules, Telephony APIs |
| **Container Infrastructure** | Docker, Docker Compose, Caddy Reverse Proxy (Automatic SSL) |

---

## 📂 Monorepo Structure

```text
message-service/
├── apps/
│   ├── backend/           # NestJS REST API and WebSockets Gateway server
│   ├── dashboard/         # React 19 / Vite management interface
│   └── mobile/            # React Native Android client (telephony bridge)
├── packages/
│   ├── config/            # Shared compiler configurations
│   ├── types/             # Shared TypeScript typings and schemas
│   └── utils/             # Cryptographic hash and phone formatting utilities
├── infra/
│   ├── caddy/             # Caddy reverse proxy templates
│   ├── api.Dockerfile     # Dockerfile for containerizing the NestJS server
│   └── docker-compose.yml # Composes MongoDB, Redis, API, and Caddy services
├── docs/
│   ├── architecture.md    # Detailed diagrams of flows, lifecycles, and database designs
│   ├── portfolio-summary.md# Technical decisions, scale calculations, and summaries
│   ├── interview-notes.md # Architecture notes and technical choices for recruiters
│   └── history/           # Development history, logs, and audit templates
└── package.json           # Monorepo workspaces and script config
```

---

## 🚀 Quick Start & Development Setup

### Prerequisites
* **Node.js**: `v18.x` or `v20.x` (LTS versions recommended)
* **Docker & Docker Compose** (For databases and quick deployments)
* **Android Studio & Physical Device** (Required to run and compile the mobile host daemon)

### 1. Repository Setup & Dependencies Installation
Clone the repository and install all node modules at the root directory level:
```bash
git clone https://github.com/yourusername/sms-gateway-platform.git
cd sms-gateway-platform
npm install
```

### 2. Configure Environment Variables
Copy and set up `.env` files using our [.env.example](file:///e:/Autonomous/files/message-service/.env.example) configuration guidelines:
* Copy root-level configs into `apps/backend/.env`
* Copy root-level configs into `apps/mobile/.env`

---

### 💻 Local Development Setup

To run database services in the background and run the stack in development watch modes:

#### Step 1: Start Redis and MongoDB containers
```bash
docker compose -f infra/docker-compose.yml up mongodb redis -d
```

#### Step 2: Boot Backend REST API server
```bash
npm run start:dev --workspace=@sms-gateway/backend
```
The backend API is now running locally on: [http://localhost:3000/api](http://localhost:3000/api)

#### Step 3: Run React Web Dashboard
```bash
npm run dev --workspace=@sms-gateway/dashboard
```
The dashboard UI will launch on: [http://localhost:5173](http://localhost:5173)

#### Step 4: Run React Native Mobile Host
Connect your physical Android device via USB (with USB Debugging enabled) and run:
```bash
npm run android --workspace=@sms-gateway/mobile
```

---

### 🐳 Docker Compose Deployment (Production)

To deploy the entire production stack including the Caddy reverse proxy and automatic HTTPS:

1. Update the Caddyfile in `infra/caddy/Caddyfile` with your domain name.
2. Ensure you have copied and configured all variables inside `.env` in `apps/backend/`.
3. Launch the containerized cluster:
```bash
docker compose -f infra/docker-compose.yml up --build -d
```

---

## 📡 API & Interactive Swagger Documentation

Interactive OpenAPI/Swagger documentation is built directly into the server. When the backend is running, navigate to:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

This provides interactive schemas, parameters, payload examples, and try-it-out capabilities for all endpoints:

* **Authentication & API Keys**: Login/register dashboard accounts, and manage programmatic client API keys.
* **SMS Dispatch Engine**: Single and bulk transactional message submissions.
* **OTP Delivery & Verification**: Trigger and verify secure SMS one-time passwords.
* **Devices Gateway Management**: List connected gateway nodes with battery and signal telemetry.

---

## 🔒 Production Security Hardening

* **Dual Authorization Pipeline**: Supports both JWT Session tokens (for UI operations) and secure SHA-256 hashed API Keys (`x-api-key` header) for automated client integration.
* **API Rate Limiting Protection**: Integrates `nestjs-throttler` to protect against brute-force attacks on `/login` (max 10/min) and API flooding on SMS endpoints.
* **SIM Abuse & Spam Shield**: Includes a custom `PhoneThrottlerGuard` limiting OTP dispatches to a maximum of 3 requests per phone number per 5 minutes.
* **Strict Validation Pipeline**: Input payloads are filtered through class-validator filters (`whitelist: true`) to avoid document injection.

---

## ⚙️ Scale and Performance Hardening

* **Mongoose Database Indexing**: Schema files contain indexes on query-intensive properties (`recipient`, `status`, `deviceId`, and `createdAt` descending) to maintain query performance under millions of logs.
* **Carrier rate throttling**: Configured BullMQ worker parameters (`limiter: { max: 1, duration: 2000 }`) to enforce a global delay of 2 seconds between SMS sends, preventing carrier suspension for spam.
* **Decoupled Queue Failover**: Job failures undergo exponential backoff retries, and are stored in the queue error state (acting as a Dead-Letter Queue) upon exhaustion.

---

## 🛣️ Future Roadmap

* [ ] **Multi-SIM Smart Routing**: Automatically direct messages to the cheapest SIM card depending on carrier code.
* [ ] **Offline Resilient Buffer**: Local SQLite storage inside the Android client to hold outbound messages during network connection drops.
* [ ] **WhatsApp & Email Integration**: Unified messaging interface handling fallback to WhatsApp when SIM network is offline.
* [ ] **Analytics Webhooks**: Deliver real-time status callbacks (`message.delivered`, `message.failed`) directly to client webhooks.

---

## 📸 Media Placeholders

### Dashboard Interface Mockup
![Dashboard Visual](./docs/history/PROJECT.md) *Placeholder: Add your admin console dashboard view here*

### Mobile Gateway App
![Mobile Device UI](./docs/history/ProjectInfo.md) *Placeholder: Sideload screenshot of your React Native client status screen here*

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
