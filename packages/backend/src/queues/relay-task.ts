import '@/init/env'
import { queue } from './queue'
import { QUEUES } from './constants'
import { RelayKitWrapper } from '@/safe-kit-wrapper'
import {
    getExecutedTransaction,
    updateExecutedTransaction,
} from '@/models/executed-transactions'

queue(QUEUES.CHECK_RELAY_TASK, async ({ txHash }, resolve, retry) => {
    const executedTransaction = await getExecutedTransaction(txHash)

    const relayKit = new RelayKitWrapper()

    const status = await relayKit.getTaskStatus(executedTransaction.taskId)

    console.log('------ STATUS ------')
    console.log(status)

    if (!status) return retry()

    if (
        status.taskState === 'CheckPending' ||
        status.taskState === 'ExecPending' ||
        status.taskState === 'WaitingForConfirmation'
    ) {
        return retry()
    }

    updateExecutedTransaction(txHash, {
        status:
            status.taskState === 'Cancelled' ||
            status.taskState === 'ExecReverted' ||
            status.taskState === 'Blacklisted' ||
            status.taskState === 'NotFound'
                ? 'FAILED'
                : status.taskState === 'ExecSuccess'
                ? 'EXECUTED'
                : 'PENDING',
        transactionHash: status.transactionHash || null,
        blockNumber: status.blockNumber || null,
        executionDate: status.executionDate
            ? new Date(status.executionDate)
            : null,
        reason: status.lastCheckMessage || null,
    })

    resolve()
})
