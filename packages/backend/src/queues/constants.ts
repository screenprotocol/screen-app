import { Safe } from '@/models/safe'

export enum QUEUES {
    RETRY = 'retry',
    FETCH_SAFE_PENDING = 'fetch-safe-pending-tasks',
    CHECK_RELAY_TASK = 'check-relay-task',
}

export type QUEUE_DATA_TYPES = {
    [QUEUES.RETRY]: any
    [QUEUES.FETCH_SAFE_PENDING]: Safe
    [QUEUES.CHECK_RELAY_TASK]: { txHash: string }
}
