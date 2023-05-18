import '@/init/env'
import Queue from 'firebase-queue'
import admin from 'firebase-admin'
import { QUEUES } from './constants'

const defaultOptions = {
    retryIn: 30, // in seconds
    pushBackInQueue: 10, // in seconds
    retries: 10000,
}

const ref = admin.database().ref(QUEUES.RETRY)

var queueRef = new Queue(ref, async (res, progress, resolve, rejectFinal) => {
    const {
        _state,
        _state_changed,
        _owner,
        _progress,
        _error_details,
        _id,
        queuePath,
        options,
        timestamp,
        retries,
        ...rest
    } = res

    console.log(rest, '----- latest retry -------')

    const reject = () => {
        setTimeout(() => {
            admin
                .database()
                .ref(`${QUEUES.RETRY}/tasks`)
                .push({
                    queuePath,
                    options,
                    timestamp,
                    retries: retries + 1,
                    ...rest,
                })
            resolve()
        }, 1000)
    }

    if (retries > options.retries) {
        admin.firestore().collection('retired').add({
            data: rest,
            queue: queuePath,
        })
        resolve()
    } else if (Date.now() - timestamp < options.retryIn * 1000) {
        console.log('Rejecting', Date.now() - timestamp, options.retryIn * 1000)
        reject()
    } else {
        admin
            .database()
            .ref(queuePath)
            .push({
                ...rest,
            })
        resolve()
    }
})

process.on('SIGINT', function () {
    console.log('Starting TransactionQueue queue shutdown')
    queueRef.shutdown().then(function () {
        console.log('Finished TransactionQueue queue shutdown')
        process.exit(0)
    })
})
