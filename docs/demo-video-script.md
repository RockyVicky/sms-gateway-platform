# Demo Video Script: 3-Minute Recruiter Showcase

This script is structured for a 3-minute video recording designed to show off the system’s architecture, responsiveness, and codebase quality to hiring managers and recruiters.

---

## ⏱️ Video Overview

* **Total Duration**: 03:00 minutes
* **Target Audience**: Engineering Managers, Lead Architects, Technical Recruiters
* **Goal**: Demonstrate functional integration, explain core architectural trade-offs, and prove backend reliability.
* **Recording Prep**: Split screen layout. On the left: Web Dashboard. On the right: Android simulator screen or physical camera feed of a test Android phone. Open terminal running NestJS/Pino logs at the bottom.

---

## 🎬 Storyboard & Narration Script

### SECTION 1: Introduction & Login (00:00 - 00:30)
* **Visual**: Show browser loading the glassmorphic Login screen. Log in using a mock credential.
* **Action**: Enter email/password, hit "Login". Transitions smoothly to the main Dashboard.
* **Voiceover**:
  > *"Hi, I'm [Your Name]. Today I'm demonstrating my self-hosted SMS Gateway SaaS Platform. This system allows businesses to send high-volume transaction messages directly through physical SIM cards on Android devices, offering a cost-effective alternative to platforms like Twilio.
  > 
  > Here is the dashboard login. The session is protected by JWT cookies with strict validation. Let's enter our credentials and jump into the administration console."*

### SECTION 2: Dashboard Overview & Device telemetry (00:30 - 01:10)
* **Visual**: Zoom in on the main dashboard KPIs (Sent, Success Rate, Queue Status). Switch to the `/devices` page.
* **Action**: Hover over the device table rows showing battery indicators and carrier listings.
* **Voiceover**:
  > *"We are now in the Admin Console. The dashboard tracks message metrics, queue sizes, and device statuses in real-time. Let's navigate to the Devices tab.
  > 
  > The platform works by keeping persistent WebSockets lines open to mobile daemons. Here we see our active device list. We are tracking telemetry including live cellular signal strength and device battery level. If a node drops to a critical battery charge, a warning banner alerts administrators automatically."*

### SECTION 3: Device Registration & Connection Handshake (01:10 - 01:40)
* **Visual**: Click "Register New Device". Fill in credentials. Show the mobile app screen transition to "Online" as it establishes a handshake.
* **Action**: Register device `pixel_node_2`. Show the terminal logging the WebSockets client registry connection.
* **Voiceover**:
  > *"Let's register a new Android node. When we create the device, the API server generates a unique cryptographic secret.
  > 
  > When the Android client boots, it executes a SHA-256 HMAC handshake request. Once verified, the API issues a WebSocket token, letting the device establish a secure link. Here, on the right, you can see the React Native client instantly switch to 'Online' as the NestJS gateway maps the socket ID."*

### SECTION 4: Ingestion, Queueing, & Native SMS Send (01:40 - 02:30)
* **Visual**: Switch to a REST API client (like Postman/curl) or the Swagger Docs. Fire a `POST /api/sms/send` request.
* **Action**: Show Swagger payload submit. The dashboard logs immediately show a new `pending` message. In the background, the BullMQ worker dequeues, rates limits, and forwards the payload. The phone screen displays a native Android popup alert "Message Sent".
* **Voiceover**:
  > *"Now, let's trigger an SMS dispatch. I'll make a POST request to our API endpoint. The request immediately receives a '202 Accepted' response, returning a message ID.
  > 
  > Behind the scenes, the NestJS controller enqueued the job into Redis. A BullMQ worker handles the dequeuing. To protect our SIM cards from carrier spam blocks, the worker implements a strict rate limit of 1 SMS every 2 seconds.
  > 
  > Watch the Android client on the right. The socket gateway forwards the event, the React Native native module invokes the Android telephony service, and the physical message is dispatched to the carrier."*

### SECTION 5: Real-Time Status & Summary (02:30 - 03:00)
* **Visual**: Return to the dashboard `/messages` history table. Point to the record that just completed, showing `Status: Sent` and an attempt count of `1`.
* **Action**: Click around the historical charts showing latency trends.
* **Voiceover**:
  > *"Back on the dashboard logs, the message state has transitioned to 'Sent'. When the cellular network delivers the text, the phone listens for the delivery report and feeds the success status back over the socket.
  > 
  > If a device goes offline or fails to respond, the system initiates an exponential backoff retry up to 3 times before routing the job to a dead-letter state in our database.
  > 
  > This architecture combines the reliability of Redis-backed message queues with the low-latency responsiveness of WebSockets. Thanks for watching. You can review the complete codebase and deployment guides in the repository."*
