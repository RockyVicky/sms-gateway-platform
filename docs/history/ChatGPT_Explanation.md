# Project Context: SMS Gateway SaaS Platform (Monorepo)

This document provides a comprehensive overview of the self-hosted SMS Gateway platform designed to run on physical Android devices using Jio/carrier SIM cards. It outlines the architecture, tech stack, database schemas, directory structure, and instructions to get started.

---

## 1. System Architecture & Message Flow

```
+------------------------+
| React Admin Dashboard  |
+-----------+------------+
            | HTTP Rest APIs
            v
+------------------------+
|  NestJS Backend API    | <=====> MongoDB (User / Message / Device / OTP data)
+-----------+------------+
            | Push SMS Job via
            v
+------------------------+
|   Redis Queue (BullMQ) |
+-----------+------------+
            | Socket.io WebSocket Event (sms:send)
            v
+------------------------+
| React Native Host App  | (Installed on Android phone)
+-----------+------------+
            | Bridge Call
            v
+------------------------+
| Android Native Module  | (SmsModule.sendSms)
+-----------+------------+
            | Cellular Network
            v
+------------------------+
|   Recipient Device     |
+------------------------+
```

1. **Dashboard & API client**: User triggers a single/bulk SMS request via HTTP API.
2. **Backend Engine**: NestJS validates requests, authenticates via JWT, persists metadata in MongoDB, and pushes the jobs to a Redis-backed BullMQ.
3. **WebSocket Gateway**: The backend emits an `sms:send` event containing the payload to the specific target Android device active on the Socket.io WebSocket connection.
4. **Android Client Host**: A React Native app running on the physical phone listens for the socket event, invokes a custom Java Native Module (`SmsModule`), and dispatches the SMS via the carrier's Jio SIM card.
5. **Status Reporting**: Once sent or failed, the Android app emits an `sms:status` event back to the gateway to update the state in MongoDB and trigger live dashboard updates.

---

## 2. Technology Stack

### Monorepo Infrastructure
* **Structure**: NPM workspaces (`apps/*`, `packages/*`)
* **Packages**:
  * `packages/types`: Shared TypeScript interfaces for users, devices, messages, and OTP models.
  * `packages/config`: Shared configurations.
  * `packages/utils`: Helper functions.

### Backend (`apps/backend`)
* **Framework**: NestJS (Node.js & TypeScript)
* **Database**: MongoDB (using Mongoose)
* **Queue**: Redis + BullMQ (using `@nestjs/bullmq`)
* **Real-time Gateway**: Socket.io (`@nestjs/websockets` & `@nestjs/platform-socket.io`)
* **Authentication**: Passport JWT with Access/Refresh Tokens and Role-Based Access Control (RBAC).

### Frontend Dashboard (`apps/dashboard`)
* **Core**: React 19 + TypeScript + Vite
* **UI & Styling**: Material-UI (MUI v6)
* **Routing & Queries**: React Router Dom, TanStack React Query (v5)
* **Analytics**: Recharts (for SMS counts, delivery statistics, and device charts)

### Mobile App Gateway (`apps/mobile`)
* **Core**: React Native (v0.86) + TypeScript
* **Real-time Client**: Socket.io Client
* **Native Integration**: PermissionsAndroid (for SMS, phone state, and location permissions) and custom Android Java Bridge `SmsModule` to call `android.telephony.SmsManager`.

### Infrastructure (`infra/`)
* **Docker Compose**: Orchestrates Containerized services:
  * **Caddy**: Serves the static build of the React Dashboard and acts as a reverse proxy with automatic HTTPS.
  * **API Service**: Runs the NestJS API server.
  * **Redis**: Backs BullMQ message queue.
  * **MongoDB**: Stores user credentials, message histories, active devices, and OTP state.

---

## 3. Core Database Schemas & Data Structures

* **`users`**:
  * Fields: `name`, `email`, `password` (hashed), `role` (Admin / API Client).
* **`devices`**:
  * Fields: `deviceId` (unique), `name`, `phoneNumber` (E.164), `provider` (e.g. Jio), `status` (online, offline), `battery`, `signal`, `publicKey` (RSA).
* **`messages`**:
  * Fields: `messageId`, `recipient`, `content`, `status` (pending, queued, sent, failed), `sentAt`, `error`.
* **`otp_requests`**:
  * Fields: `phone`, `otp` (hashed), `expiresAt`, `verified`, `retryCount`.

---

## 4. Directory Structure

```
message-service/
├── package.json               # Root workspace manifest
├── apps/
│   ├── backend/               # NestJS server code
│   │   ├── src/
│   │   │   ├── auth/          # Authentication & JWT strategy
│   │   │   ├── common/        # Filters, Interceptors, Guards
│   │   │   ├── devices/       # Device endpoints & Socket.io gateway
│   │   │   ├── sms/           # SMS routing, history, BullMQ handlers
│   │   │   ├── otp/           # OTP logic, generation & verification
│   │   │   └── main.ts        # App Entry Point
│   ├── dashboard/             # React dashboard admin UI (Vite)
│   └── mobile/                # React Native Android client host
│       ├── App.tsx            # Host App UI, registration & permission controls
│       └── src/services/
│           └── websocket.ts   # Socket connection handler and SmsModule callback
└── packages/
    ├── types/                 # Shared TypeScript interfaces
    ├── config/                # Shared settings config
    └── utils/                 # General helpers
```
