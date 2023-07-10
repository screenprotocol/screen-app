import Queue from 'firebase-queue'
import admin from 'firebase-admin'
import { QUEUES, QUEUE_DATA_TYPES } from './constants'

export type QueueOptions = {
    retryIn: number
    pushBackInQueue: number
    retries: number
}

const defaultOptions = {
    retryIn: 5, // in seconds
    pushBackInQueue: 5, // in seconds
    retries: 10000,
}

export async function pushToQueue<Q extends QUEUES>(
    queue: Q,
    data: Q extends keyof QUEUE_DATA_TYPES ? QUEUE_DATA_TYPES[Q] : never,
) {
    console.log(`------ PUSHING TO QUEUE ${queue} with data ------`, data)
    const queueRef = admin.database().ref(`${queue}/tasks`)
    return queueRef
        .push(data)
        .then((ref) => {
            console.log(`PUSHED TO QUEUE ${queue}`)
            return ref
        })
        .catch((e) => {
            console.log(e)
        })
}

type QueueInternalOptions<T> = T & {
    _state: string
    _state_changed: number
    _owner: string
    _progress: number
    _error_details: string
    _id: string
    timestamp: number
}

export const queue = <Q extends QUEUES>(
    refPath: Q,
    eventCb: (
        data: Q extends keyof QUEUE_DATA_TYPES ? QUEUE_DATA_TYPES[Q] : never,
        resolve: () => void,
        retry: () => void,
        reject: () => void,
        progress: number,
    ) => Promise<void>,
    options: QueueOptions = defaultOptions,
) => {
    var ref = admin.database().ref(refPath)
    options = {
        ...defaultOptions,
        ...options,
    }
    var queueRef = new Queue(
        ref,
        async (
            data: QueueInternalOptions<
                Q extends keyof QUEUE_DATA_TYPES ? QUEUE_DATA_TYPES[Q] : never
            >,
            progress: number,
            resolve: () => void,
            reject: () => void,
        ) => {
            const retry = () => {
                const {
                    _state,
                    _state_changed,
                    _owner,
                    _progress,
                    _error_details,
                    _id,
                    ...rest
                } = data

                admin
                    .database()
                    .ref(`${QUEUES.RETRY}/tasks`)
                    .push({
                        ...rest,
                        queuePath: `${refPath}/tasks`,
                        timestamp: Date.now(),
                        retries: 1,
                        options,
                    })
                return resolve()
            }

            if (Date.now() - data.timestamp < options.retryIn * 1000) {
                retry()
            } else {
                try {
                    await eventCb(data, resolve, retry, reject, progress)
                } catch (e) {
                    console.log(e, '---->')
                    retry()
                }
            }
        },
    )

    process.on('SIGINT', function () {
        console.log('Starting TransactionQueue queue shutdown')
        queueRef.shutdown().then(function () {
            console.log('Finished TransactionQueue queue shutdown')
            process.exit(0)
        })
    })
}
