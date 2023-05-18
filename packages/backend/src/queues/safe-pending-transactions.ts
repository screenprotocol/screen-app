import '@/init/env'
import { pushToQueue, queue } from '@/queues/queue'
import { QUEUES } from '@/queues/constants'
import { RelayKitWrapper, SafeApiKitWrapper } from '@/safe-kit-wrapper'
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'
import {
    createExecutedTransaction,
    getExecutedTransaction,
    updateExecutedTransaction,
} from '@/models/executed-transactions'
import moment from 'moment'
import { updateSAFE } from '@/models/safe'

queue(QUEUES.FETCH_SAFE_PENDING, async (safe, resolve, retry) => {
    try {
        const safeService = new SafeApiKitWrapper(safe.chainId)

        if (!process.env.SPONSOR_GAS_MODULE_ADDRESS)
            throw new Error('SPONSOR_GAS_MODULE_ADDRESS not set')

        const isModuleEnabled = await safeService.isModuleEnabled(
            safe.address,
            process.env.SPONSOR_GAS_MODULE_ADDRESS,
        )

        if (!isModuleEnabled) {
            await updateSAFE(safe.address, {
                status: 'DISABLED',
            })
            return resolve()
        } else {
            await updateSAFE(safe.address, {
                status: 'ENABLED',
            })
        }

        const txToExecute: SafeMultisigTransactionResponse | null =
            await safeService.getTransactionToExecute(safe.address)

        if (txToExecute === null) return resolve()

        const executedTransaction = await getExecutedTransaction(
            txToExecute.safeTxHash,
        )

        // checks that can be put
        // 1. Retry within 30 seconds
        // 2. Retry 5 times
        // 3. Pause Safe

        if (executedTransaction) {
            if (
                executedTransaction.status === 'PENDING' ||
                executedTransaction.status === 'EXECUTED'
            )
                return resolve()
            const executedAt = moment(executedTransaction.executedAt)
            console.log('----- executedAt ------')
            console.log(moment().diff(executedAt, 'seconds'))

            if (moment().diff(executedAt, 'seconds') < 30) return resolve()

            console.log('----- retry ------')
            console.log(executedTransaction.retry)
            if (executedTransaction.retry && executedTransaction.retry > 5) {
                await updateSAFE(safe.address, {
                    status: 'PAUSED',
                })
                return resolve()
            }
        }

        const relayKit = new RelayKitWrapper()

        const relayTransaction = await relayKit.getRelayTransaction(
            safe.chainId,
            txToExecute,
        )

        const relayResp = await relayKit.relayTransactionWithContext(
            relayTransaction,
        )

        if (executedTransaction) {
            updateExecutedTransaction(txToExecute.safeTxHash, {
                status: 'PENDING',
                taskId: relayResp.taskId,
                retry: executedTransaction.retry
                    ? executedTransaction.retry + 1
                    : 1,
                executedAt: new Date(),
            })
        } else {
            createExecutedTransaction({
                safeTxHash: txToExecute.safeTxHash,
                taskId: relayResp.taskId,
            })
        }

        pushToQueue(QUEUES.CHECK_RELAY_TASK, {
            txHash: txToExecute.safeTxHash,
        })

        resolve()
    } catch (err) {
        console.log(err)
        retry()
    }
})
