# DECISIONS.md

## Architecture Decisions

Date: 2026

---

## Backend

Decision:
NestJS

Reason:
- Scalable
- Modular
- Enterprise Ready
- Excellent TypeScript Support

Status:
Approved

---

## Database

Decision:
MongoDB

Reason:
- Flexible Schema
- Fast Development
- Suitable for Message Storage

Status:
Approved

---

## Queue System

Decision:
BullMQ

Reason:
- Redis Based
- Reliable
- Supports Retries
- Supports Delayed Jobs

Status:
Approved

---

## Cache

Decision:
Redis

Reason:
- Queue Support
- Fast Access
- Session Storage

Status:
Approved

---

## Mobile

Decision:
React Native

Reason:
- Existing Team Expertise
- Faster Development

Status:
Approved

---

## SMS Delivery

Decision:
Android Native SMS APIs

Reason:
- Direct SIM Access
- No Third Party Provider Needed

Status:
Approved

---

## Dashboard

Decision:
React + Material UI

Reason:
- Fast Development
- Professional UI

Status:
Approved

---

## Infrastructure

Decision:
Docker Compose

Reason:
- Easy Deployment
- VPS Friendly

Status:
Approved

---

## Reverse Proxy

Decision:
Caddy

Reason:
- Automatic HTTPS
- Simple Configuration

Status:
Approved

---

## Authentication

Decision:
JWT + Refresh Tokens

Reason:
- Stateless
- Scalable

Status:
Approved

---

## API Documentation

Decision:
Swagger

Reason:
- Auto Generated
- Developer Friendly

Status:
Approved

---

## Monorepo Strategy

Decision:
Monorepo

Structure:

apps/
packages/
infra/
docs/

Reason:
- Shared Types
- Easier Maintenance

Status:
Approved

---

## Detailed Platform Config Decisions

Date: 2026-06-18

Decisions:
1. Use native NPM Workspaces.
2. OTP validity = 5 minutes.
3. Queue TTL = 10 minutes.
4. Retry attempts = 3.
5. Retry delay = 30 seconds.
6. Retain audit logs permanently.
7. Add Webhook Callback support.
8. Add API Key Management module.

Status:
Approved