# PROJECT.md

# SMS Gateway SaaS Platform

## Overview

A self-hosted SMS platform using Android devices and physical SIM cards.

The platform allows businesses to:

* Send SMS
* Send OTP
* Track delivery
* Monitor devices
* Manage users

---

## MVP Features

### Authentication

* Register
* Login
* JWT
* Refresh Token

### SMS

* Send SMS
* Bulk SMS
* Schedule SMS
* SMS History

### OTP

* Generate OTP
* Verify OTP
* Expiration
* Retry Limits

### Devices

* Register Device
* Device Health
* Battery Status
* Signal Status

### Dashboard

* SMS Count
* Success Rate
* Device Status
* Recent Activity

---

## Architecture

React Dashboard

↓

Node.js API

↓

Redis Queue

↓

Android SMS Gateway

↓

SIM Card

↓

Recipient

---

## Tech Stack

Backend:

* Node.js
* Express
* TypeScript

Database:

* MongoDB

Queue:

* Redis
* BullMQ

Frontend:

* React
* Material UI

Mobile:

* React Native

Infrastructure:

* Docker
* Nginx

---

## Security Requirements

* JWT Authentication
* API Rate Limiting
* Request Validation
* Device Authentication
* Password Hashing
* Audit Logging

---

## Non Functional Requirements

* 99% message processing reliability
* Horizontal scaling
* Queue-based architecture
* Mobile offline recovery

---

## Future Features

* Multi SIM support
* WhatsApp Integration
* Email Gateway
* AI Message Templates
* Billing System
* Customer Accounts
* Public API Keys
