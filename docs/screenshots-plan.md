# Visual Asset Plan: Screenshots Portfolio

This document maps out the required screenshots to showcase the operational UI, dashboard, and mobile client components of the SMS Gateway SaaS Platform.

---

## 📸 Key Screenshot Requirements

To make the repository highly appealing to recruiters and engineering managers, we need visual evidence of a functional front-end dashboard and an active mobile host. Below is the list of key screens, the components they should display, and why they are included.

### 1. Login Screen
* **Path**: `/login` (React Dashboard)
* **Visual Elements**:
  * Sleek, modern card layout with a dark glassmorphic UI.
  * Inputs for Email and Password.
  * Integration showing "Sign in with Google" or single-sign-on placeholders.
  * Validation hints for email formatting.
* **Recruiter Takeaway**: Demonstrates clean layout, responsive design, and integration of professional UI practices.

### 2. Dashboard Overview
* **Path**: `/dashboard` (React Dashboard)
* **Visual Elements**:
  * Hero KPI Cards: Total Messages Sent, Success Rate (%), Active Devices, Queued Messages.
  * Real-time dynamic charts (Recharts) showing message volume over time (hourly/daily trends).
  * System alerts showing warnings (e.g., "Device 'SIM-Node-1' battery low: 15%").
* **Recruiter Takeaway**: Shows dashboard engineering capability, telemetry parsing, and data visualization.

### 3. Device Management
* **Path**: `/dashboard/devices` (React Dashboard)
* **Visual Elements**:
  * List of registered devices in a clean table format.
  * Indicators for Status (Online - green pulse, Offline - grey, Paused - orange).
  * Live hardware metrics: Phone Number, Carrier (e.g., Jio, Vodafone), Battery level (with progress bars), Signal strength (cellular icons).
  * "Register New Device" button showing modal with input fields for RSA Public Keys.
* **Recruiter Takeaway**: Shows capacity to build complex management systems handling hardware telemetry.

### 4. SMS History
* **Path**: `/dashboard/messages` (React Dashboard)
* **Visual Elements**:
  * Tabbed table filtering messages by status: All, Queued, Sent, Failed.
  * Columns: Recipient (masked for privacy), Content snippet, Device ID, Attempt count, Timestamp, Status Badge.
  * Search bar (by recipient phone number) and Date-Range Picker.
* **Recruiter Takeaway**: Demonstrates implementation of data tables, server-side pagination, search filtering, and handling large data grids.

### 5. OTP Management
* **Path**: `/dashboard/otp` (React Dashboard)
* **Visual Elements**:
  * Logs showing OTP requests generated and verified.
  * Dynamic charts showing OTP Verification Success Ratio (e.g., "85% verified within 60 seconds").
  * Status breakdown (Expired, Max Attempts Exceeded, Verified, Unverified).
* **Recruiter Takeaway**: Highlights security consciousness and real-world transaction management dashboards.

### 6. Analytics
* **Path**: `/dashboard/analytics` (React Dashboard)
* **Visual Elements**:
  * Multi-axis line/area charts representing Message Throughput (messages/sec) vs. Latency (seconds from REST dispatch to SIM transmission).
  * Pie chart breaking down failure reasons (e.g., "No Carrier Signal", "Out of Credits", "Device Connection Timeout").
  * Device usage distribution (which SIM card is sending the most traffic).
* **Recruiter Takeaway**: Proves focus on operational monitoring, service level agreements (SLAs), and failure analysis.

### 7. System Status
* **Path**: `/dashboard/status` (React Dashboard)
* **Visual Elements**:
  * Backend API Health: CPU usage, Memory heap size, Uptime.
  * Redis Cache status and BullMQ Queue metrics (Active jobs, Wait times, Delayed jobs).
  * Live terminal feed simulation displaying Pino structured JSON logs.
* **Recruiter Takeaway**: Signals developer maturity in DevOps, monitoring, caching systems, and platform stability.

### 8. Settings & Profile
* **Path**: `/dashboard/settings` (React Dashboard)
* **Visual Elements**:
  * API Key Management panel where developers can generate and revoke programmatic credentials (e.g., `x-api-key`).
  * Webhook subscription endpoint configuration (e.g., `http://my-api.com/webhooks`).
  * Account credential update settings.
* **Recruiter Takeaway**: Demonstrates complete product thinking, security token management, and B2B SaaS integrations.

### 9. Mobile Gateway Application
* **Path**: Android Device Screen (React Native Host App)
* **Visual Elements**:
  * Connection Status header (e.g., "Status: Online" with active pulsing green banner).
  * Socket Connection details (e.g., connected to `wss://api.smsgateway.com` on Socket ID `xyz123`).
  * Active SMS Queue count inside the app (e.g., "Queue: 0 pending").
  * Settings Panel: toggle for "Start on Boot", "Keep CPU awake (Wakelock)", and logs view.
* **Recruiter Takeaway**: Visual proof of the cross-platform nature of the solution and native Android integration capabilities.

---

## 🗂️ Asset Placement Mapping

All screenshot files should be named cleanly and saved in the following folder structure to keep the root tidy:
```text
docs/
└── images/
    ├── login.png
    ├── dashboard.png
    ├── devices.png
    ├── messages.png
    ├── otp.png
    ├── analytics.png
    ├── status.png
    ├── settings.png
    ├── mobile_app.png
    └── demo.gif (Animated walkthrough of core flows)
```
