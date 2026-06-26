# Screenshot Generation Guide

This guide provides instructions for capturing and staging the visual screenshots requested in the [Visual Asset Plan](./screenshots-plan.md). The goal is to ensure all images are uniform, high-resolution, look professional, and display realistic, production-ready telemetry data.

---

## 🎨 Global Styling Guidelines

1. **Theme**: Use a uniform theme. If the app has a Dark/Light toggle, choose **Dark Mode** (looks premium, emphasizes modern charts).
2. **Typography**: Ensure fonts are legible. Use the system default sans-serif or imported Google Fonts (e.g., Inter, Roboto).
3. **Mock Data Quality**: Never use placeholders like `test`, `asdf`, `foo`, or empty lists. Seed the databases before taking screenshots so lists look packed with real transactions.
4. **Resolution**: All web dashboard screenshots must be taken at a standard resolution of **1920x1080** (16:9 aspect ratio) with browser window margins cropped out.
5. **Format**: Save as PNG format. Compress using standard lossy/lossless compressors to keep file sizes under 2MB.

---

## 📸 Individual Screen Guidelines

### 1. Dashboard Overview
* **Target File**: `docs/images/dashboard.png`
* **Staged Content**:
  * Metrics Grid:
    * *Total Sent*: `142,893`
    * *Success Rate*: `99.82%`
    * *Active Devices*: `5`
    * *Queued (BullMQ)*: `0`
  * charts: A Recharts Area Chart displaying a 24-hour cycle showing message volume peaks around mid-day (e.g. 5,000 sent/hr).
  * System alerts: A card listing low battery or signal warnings (e.g. `[Warning] Node 'Pixel-6-Jio': Battery is at 14%`).
* **Hiring Manager Impact**: Demonstrates that the candidate understands **operational visibility**. Having a dashboard is nice, but exposing real telemetry indicators showing health states shows system design maturity.

### 2. Connected Devices Gateway
* **Target File**: `docs/images/devices.png`
* **Staged Content**:
  * A table list of 4–5 devices:
    * `pixel_6_jio` | Jio Carrier | +91 98765 43210 | Status: Online (Pulse Green) | Battery: 89% | Signal: 4/4
    * `samsung_s21_voda` | Vodafone | +91 87654 32109 | Status: Online (Pulse Green) | Battery: 12% | Signal: 3/4
    * `moto_g_airtel` | Airtel | +91 76543 21098 | Status: Paused (Orange) | Battery: 100% | Signal: 1/4 (Poor)
    * `oneplus_9_jio` | Jio Carrier | +91 65432 10987 | Status: Offline (Grey) | Battery: 0% (Discharged) | Signal: 0/4
  * A clickable "Register Device" button.
* **Hiring Manager Impact**: Shows the candidate knows how to build system status tables, manage hardware states, and display live cellular signal/battery telemetry from IoT-like nodes.

### 3. Message Logs & History
* **Target File**: `docs/images/messages.png`
* **Staged Content**:
  * A list of 10 mock transactions:
    * `+91 99999 88888` | "Your OTP code is 432198. Exp 5m." | Status: Sent | Attempts: 1 | Device: `pixel_6_jio` | 2 minutes ago
    * `+91 99999 77777` | "Alert: CPU usage exceeds 95% on pod-2." | Status: Sent | Attempts: 1 | Device: `samsung_s21_voda` | 5 minutes ago
    * `+91 99999 66666` | "Your code is 987654." | Status: Failed (Out of Credits) | Attempts: 3 | Device: `moto_g_airtel` | 10 minutes ago
  * Search bar filled with `+91 99999` to show active filtering.
  * Status filter pills.
* **Hiring Manager Impact**: Proves implementation of complex paginated data views, sorting capabilities, error status reporting, and the ability to track large transactional history sets.

### 4. Analytics & Insights
* **Target File**: `docs/images/analytics.png`
* **Staged Content**:
  * A scatter/line chart comparing **API ingestion latency** vs. **carrier dispatch latency** (average latency under 1.8s).
  * A doughnut chart showing failure distribution: `Signal Loss (12%)`, `Carrier Rejected (4%)`, `App Crash (2%)`, `Out of Credits (82%)`.
  * Total counts representing daily aggregates.
* **Hiring Manager Impact**: Demonstrates that the candidate is metric-driven and builds systems with SLAs and debugging statistics in mind.

### 5. Mobile Gateway Client App
* **Target File**: `docs/images/mobile_app.png`
* **Staged Content**:
  * Physical device frame screenshot.
  * Pulser indicating "WebSocket Connected" (Green status).
  * Connection log viewport displaying local telemetry broadcasts.
  * System alerts showing local logs (e.g. `[18:14:02] Dequeued job #238914. Invoking android.telephony.SmsManager. sent successfully.`).
* **Hiring Manager Impact**: Proves that this is not just a mockup, but a fully functional hardware bridge interacting with native Android code.
