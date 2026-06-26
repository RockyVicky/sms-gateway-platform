# CONSTRAINTS.md

## Project Goal

Build a production-ready SMS Gateway SaaS platform using Android devices and SIM cards for SMS delivery.

---

## Backend Requirements

Framework:
- NestJS

Language:
- TypeScript

Database:
- MongoDB
- Mongoose

Queue:
- Redis
- BullMQ (@nestjs/bullmq)

Authentication:
- JWT
- Refresh Tokens

Validation:
- class-validator
- class-transformer

Documentation:
- Swagger/OpenAPI

Architecture:
- Clean Architecture
- SOLID Principles
- Dependency Injection

Testing:
- Jest
- Integration Tests

---

## Frontend Requirements

Framework:
- React

Language:
- TypeScript

UI Library:
- Material UI

State Management:
- React Query
- Context API

Charts:
- Recharts

Testing:
- React Testing Library

---

## Mobile Requirements

Framework:
- React Native

Platform:
- Android Only

Requirements:
- SMS Sending
- Background Services
- Device Monitoring
- Battery Monitoring
- Signal Monitoring
- Heartbeat Service

Native Modules:
- Android SMS APIs

Testing:
- Jest
- Detox

---

## Infrastructure Requirements

Containerization:
- Docker
- Docker Compose

Web Server:
- Caddy

Deployment:
- Ubuntu VPS

Monitoring:
- Health Checks
- Logging

Storage:
- Persistent Docker Volumes

Backups:
- Daily MongoDB Backups

---

## Security Requirements

Authentication:
- JWT
- Refresh Tokens

Authorization:
- RBAC

Protection:
- Rate Limiting
- Request Validation
- Helmet
- CORS

Device Security:
- Device Tokens
- Device Registration
- Device Authentication

Audit:
- Audit Logs
- Security Logs

---

## Code Standards

Language:
- TypeScript Strict Mode

Formatting:
- ESLint
- Prettier

Principles:
- SOLID
- DRY
- KISS

Folder Structure:
- Feature Based

Documentation:
- README Required
- Swagger Required

Testing:
- Minimum 80% Coverage

---

## Performance Requirements

API Response:
- < 300ms average

Queue Processing:
- Async

Scalability:
- Multiple Android Devices
- Multiple Queue Workers

Reliability:
- Message Retry Support
- Offline Recovery

---

## Deliverables

Every module must contain:

- Source Code
- Tests
- Documentation
- API Contracts
- Error Handling
- Logging