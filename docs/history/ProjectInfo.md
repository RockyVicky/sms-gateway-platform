# SMS Gateway Platform - Multi-Agent Development Specification

## Project Overview

Build a self-hosted SMS Gateway platform that uses an Android device with a Jio SIM card to send SMS messages on behalf of web and mobile applications.

### Primary Goals

* Send SMS through Android device
* OTP generation and verification
* REST API for external applications
* Message queue management
* Delivery tracking
* User management
* Analytics dashboard
* Docker deployment

---

# System Architecture

Client App
↓
API Gateway
↓
Message Queue
↓
Android SMS Gateway App
↓
Jio SIM
↓
Recipient

Components:

1. Android SMS Gateway
2. NestJS Backend
3. MongoDB Database
4. React Admin Dashboard
5. Authentication Service
6. Notification Service

---

# Tech Stack

Backend:

* Node.js
* NestJS
* MongoDB
* Redis
* BullMQ (using @nestjs/bullmq)
* JWT

Frontend:

* React
* Material UI

Mobile:

* React Native
* Native Android SMS APIs

Infrastructure:

* Docker
* Caddy (with automatic HTTPS)
* VPS

---

# Database Collections

users

{
name,
email,
password,
role
}

devices

{
deviceId,
phoneNumber,
provider,
status,
battery,
signal
}

messages

{
messageId,
recipient,
content,
status,
sentAt
}

otp_requests

{
phone,
otp,
expiresAt,
verified
}

---

# API Endpoints

POST /api/auth/login

POST /api/sms/send

POST /api/otp/send

POST /api/otp/verify

GET /api/messages

GET /api/devices

GET /api/dashboard/stats

---

# Security

* JWT Authentication
* Role Based Access
* Rate Limiting
* Request Validation
* Device Authentication
* OTP Expiry
* Audit Logs

---

# Milestones

Phase 1:
Android SMS Gateway

Phase 2:
NestJS APIs

Phase 3:
OTP Service

Phase 4:
Dashboard

Phase 5:
Docker Deployment

Phase 6:
Monitoring & Analytics
