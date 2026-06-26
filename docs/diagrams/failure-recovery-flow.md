# Failure Recovery Flow

How the system handles physical connection drops, native app restarts, socket timeouts, and carrier outages.

```mermaid
graph TD
    subgraph Failures
        F_Conn[1. Socket Disconnect]
        F_Timeout[2. No App ACK Timeout]
        F_Carrier[3. Carrier Error / Insufficient Balance]
    end

    subgraph Recovery Paths
        %% Path 1
        F_Conn --> P1_Retry[App attempts reconnect with exponential backoff]
        P1_Retry --> P1_Offline[Backend marks device offline in DB]
        P1_Offline --> P1_Buff[Outbound messages pool in BullMQ Waiting state]

        %% Path 2
        F_Timeout --> P2_Timer[Registry 30s timer rejects]
        P2_Timer --> P2_Fail[Worker fails the current job]
        P2_Fail --> P2_Retry[BullMQ schedules retry with 30s delay]

        %% Path 3
        F_Carrier --> P3_Err[Android returns SMS_ERROR code]
        P3_Err --> P3_Report[App forwards status:failed & error msg]
        P3_Report --> P3_Log[Backend updates message status and appends errorMessage]
        P3_Log --> P3_Limit[Evaluate retry attempt counter]
        P3_Limit -- "Attempts < 3" --> P3_Retry[BullMQ Schedules retry]
        P3_Limit -- "Attempts >= 3" --> P3_DLQ[Update status to failed and notify admin]
    end

    style F_Conn fill:#ffcccc,stroke:#ff3333,stroke-width:2px
    style F_Timeout fill:#ffcccc,stroke:#ff3333,stroke-width:2px
    style F_Carrier fill:#ffcccc,stroke:#ff3333,stroke-width:2px
    
    style P1_Buff fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P2_Retry fill:#d4edda,stroke:#28a745,stroke-width:2px
    style P3_DLQ fill:#f8d7da,stroke:#721c24,stroke-width:2px
```

### Flow Highlights

1. **Connection Resilience**: React Native client reconnection routines use random jitter exponential backoff to avoid flooding the WebSockets server on recovery.
2. **Acknowledgment Registry**: Ensures that messages sent to devices that crash mid-delivery are not lost. If no status packet comes back within 30 seconds, the job is failed, returned to Redis, and picked up again.
3. **Verbose Diagnostics**: Native Android failure codes (e.g., `RESULT_ERROR_GENERIC_FAILURE`, `RESULT_ERROR_NO_SERVICE`, `RESULT_ERROR_LIMIT_EXCEEDED`) are propagated back to the database, allowing admins to debug SIM balances or network coverage issues.
