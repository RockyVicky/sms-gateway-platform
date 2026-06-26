# Authentication Flow

Dual authentication architecture separating admin user dashboard sessions from third-party programmatic API client keys.

```mermaid
graph TD
    subgraph ClientApp ["Client Application / Developer"]
        Dev[Programmatic API Client / SDK]
        Admin[Web Dashboard Administrator]
    end

    subgraph AuthGateways ["Authentication Gateways (NestJS)"]
        JWT_Guard[JwtAuthGuard / Passport JWT]
        API_Key_Guard[ApiKeyGuard / SHA-256 Auth]
    end

    subgraph SecurityOps ["Security Operations"]
        Verify_JWT[Decrypt & Verify Cookie Signature]
        Hash_API[Compute SHA-256 hash of header x-api-key]
    end

    subgraph DataStores ["Data Stores"]
        UserDB[(Users Collection)]
        DeviceDB[(Devices Collection)]
    end

    subgraph RequestAuthorized ["Request Authorized"]
        Resource[Protected REST Controller Endpoint]
    end

    %% Web Dashboard Session
    Admin -- "POST /api/auth/login {email, password}" --> UserDB
    UserDB -- "Match hash" --> Token[Generate JWT Session Cookie]
    Token -- "Returns Cookie" --> Admin

    Admin -- "Subsequent requests (Bearer/Cookie JWT)" --> JWT_Guard
    JWT_Guard --> Verify_JWT
    Verify_JWT -- "Valid Signature & Exp" --> Resource
    Verify_JWT -- "Invalid/Expired" --> Deny_JWT[Throw 401 Unauthorized]

    %% Programmatic API Integrations
    Dev -- "Headers: x-api-key: dev_sdk_key_123" --> API_Key_Guard
    API_Key_Guard --> Hash_API
    Hash_API --> Match_Hash[Match against hashed key in user profile]
    Match_Hash -- "Match found" --> Resource
    Match_Hash -- "Match fail" --> Deny_API[Throw 401 Unauthorized]
```

### Flow Highlights

- **Bearer Token & HTTP-Only Cookie Support**: Web dashboard utilizes secure token session exchange to protect administrators against Cross-Site Scripting (XSS).
- **Programmatic API Keys**: Developers integration clients use high-throughput custom headers. The database stores SHA-256 hashes of the keys rather than plain-text, ensuring authorization credentials remain secure.
- **Strict Guard Separation**: Controllers isolate endpoints, ensuring mobile endpoints, management consoles, and dispatch API endpoints use the narrowest possible permission scopes.
