# GitHub Repository Metadata Settings

Use these pre-formatted snippets to populate your repository's metadata on the GitHub UI (About Section, Topics, Social Previews, and Releases) to maximize recruiter discovery and presentation appeal.

---

## 📝 Repository Description
> A production-grade, self-hosted SMS Gateway SaaS Monorepo. Bridges web app API requests to physical Android devices to send transactional SMS & OTPs using local carrier SIM cards. Built with NestJS, React, React Native, Redis/BullMQ, WebSockets, and Docker.

---

## 🏷️ Repository Topics
Apply these tags in your GitHub settings to optimize for search indexing and ranking under relevant technologies:
```text
nestjs, react, react-native, android, websockets, socket-io, redis, bullmq, mongodb, sms-gateway, otp-verification, monorepo, docker-compose, typescript, structured-logging, rate-limiting
```

---

## 🖼️ About Box Settings
* **Website URL**: (Link to your portfolio site or hosted dashboard demo)
* **Checkboxes to Enable**:
  * [x] Release notes (displays current version in sidebar)
  * [x] Packages (displays published NPM packages if any)
  * [x] Environments (displays deployment targets like staging/production)

---

## 💬 Social Preview Text
If you upload a custom repository card image, use this text for the preview description:
> "Self-hosted SMS Gateway SaaS Platform. Dispatch low-cost transaction messages (OTP, notifications) through physical Android SIM nodes. Featuring BullMQ retry queues, NestJS rate-limiting, Socket.io telemetry, React dashboards, and automatic Docker TLS setups."

---

## 🚀 Release Notes: v1.0.0 (Initial Production Hardening Release)

Create a release titled `v1.0.0` with the following release logs:

```markdown
# Release v1.0.0: Production-Ready Direct SMS Infrastructure

Welcome to the initial stable release of the self-hosted SMS Gateway SaaS Platform. This release transitions the codebase from a development prototype to a production-hardened monorepo.

### 🔒 Security Hardening
* **Rate Limiting**: Configured `nestjs-throttler` globally.
* **SIM Spam Protection**: Custom `PhoneThrottlerGuard` limiting OTP sends to a maximum of 3 requests per phone number per 5 minutes to prevent carrier billing abuse.
* **Credential Protection**: Implemented custom SHA-256 API Key verification for programmatic client endpoints.

### ⚙️ Performance & Scalability
* **Database Optimization**: Added performance indexes across Mongoose schemas (on user emails, device IDs, message recipient records, and OTP expiration logs) for faster lookups under high transactional volumes.
* **Carrier Safety Throttle**: Configured worker rate limits (1 SMS every 2 seconds per device) in BullMQ to prevent carrier line suspensions.
* **DLQ Synchrony**: Unified worker failures back into the database logs (syncing failed states to represent a Dead-Letter Queue).

### 📊 Operations & Telemetry
* **Structured Logging**: Swapped out standard console logs for structured JSON logs using Pino, suitable for ELK, Datadog, or AWS CloudWatch consumption.
* **Interactive API Documentation**: Configured OpenAPI / Swagger UI at `/api/docs` with full JWT and API key security schemas.

### 📦 Repository Clean Up
* Configured robust root `.gitignore` files.
* Created `CONTRIBUTING.md` and `LICENSE` files.
* Added comprehensive architectural guides and recycler showcase notes.
```
