# Device Registration Flow

Securing and enrolling a physical Android device as a message relay node.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Dashboard UI
    participant Backend as NestJS API Server
    participant DB as MongoDB Database
    participant Mobile as React Native Host App

    Admin->>Backend: POST /api/devices/register { deviceId, name, phoneNumber, provider } (JWT)
    activate Backend
    Backend->>DB: Check if deviceId already registered
    DB-->>Backend: Return result
    
    alt Device does not exist
        Backend->>DB: Save Device (status = "offline", apiSecret = CryptographicSecret)
        Backend-->>Admin: Return 201 Created { deviceId, apiSecret }
    else Device already exists
        Backend->>DB: Update metadata (name, phoneNumber, provider)
        Backend-->>Admin: Return 200 OK { deviceId, message: "Metadata updated" }
    end
    deactivate Backend

    Note over Mobile,Backend: Handshake & Connection Phase
    Mobile->>Backend: GET /api/devices/handshake { deviceId, signature } (using apiSecret hash)
    activate Backend
    Backend->>Backend: Verify signature match
    Backend-->>Mobile: Handshake verified (Return Socket Auth Token)
    deactivate Backend

    Mobile->>Backend: WebSockets Connect (with Socket Auth Token)
    activate Backend
    Backend->>DB: Update device status = "online", socketId = socket.id, lastSeenAt = Date.now()
    Backend-->>Mobile: Connection Established
    deactivate Backend
```

### Flow Highlights

- **Pre-Registration**: Devices must be registered on the web dashboard to prevent rogue devices from joining the platform.
- **HMAC / SHA-256 Handshake**: React Native client authenticates itself using a unique signature hashed with the device's shared secret.
- **WebSocket Session Coupling**: Once online, the WebSocket connection binds the client `socketId` to the device document, enabling rapid lookups by the message processor.
