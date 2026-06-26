# Queue Processing Flow

Detailed lifecycle of an SMS dispatch job inside the BullMQ Redis queue cluster.

```mermaid
stateDiagram-v2
    [*] --> Active : Job Added to Queue
    
    state Active {
        [*] --> Ingested : Controller pushes job
        Ingested --> Waiting : Awaiting availability
        Waiting --> Processing : Worker pulls job
    }

    state Processing {
        [*] --> CheckCarrierLimit : Delay applied if last message sent < 2s
        CheckCarrierLimit --> CheckDeviceConnection : Query Gateway Registry
        
        state CheckDeviceConnection {
            [*] --> DeviceOnline : socketId is valid
            [*] --> DeviceOffline : socketId is null
        }
        
        DeviceOnline --> DispatchEvent : Emit "sms:send"
        DispatchEvent --> AwaitingAcknowledge : Start 30s Timeout Timer
        
        state AwaitingAcknowledge {
            [*] --> SuccessCallback : "sms:status" (sent)
            [*] --> ErrorCallback : "sms:status" (failed)
            [*] --> TimeoutCallback : 30s expires
        }
    }

    SuccessCallback --> Completed : Job succeeds
    
    ErrorCallback --> Failed : Increment attempt count
    TimeoutCallback --> Failed : Increment attempt count
    DeviceOffline --> Failed : Increment attempt count

    state Failed {
        [*] --> EvaluateAttempts
        EvaluateAttempts --> Delayed : Attempts < 3 (Exponential backoff)
        EvaluateAttempts --> DeadLetterQueue : Attempts >= 3 (Final Fail)
    }

    Delayed --> Waiting : Wait duration expires
    DeadLetterQueue --> [*] : Persisted in DB as status: "failed"
    Completed --> [*] : Clean job out of memory / Log success
```

### Flow Highlights

- **Rate-Limited Workers**: Workers enforce spacing of jobs to avoid carrier blocks, ensuring a safe gap of 2 seconds per physical SIM node.
- **Out-of-Band Retries**: If devices drop offline, the job goes back to the wait state without failing the transaction globally.
- **Dead-Letter Sync**: Messages that exhaust all 3 retries update the MongoDB status to `failed` and record the last observed error message, acting as the system's Dead-Letter Queue.
