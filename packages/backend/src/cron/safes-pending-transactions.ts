import '@/init/env'
import { getAllSafe } from '@/models/safe'
import scheduleCron from '@/cron/cron'
import { pushToQueue } from '@/queues/queue'
import { QUEUES } from '@/queues/constants'

const duration = process.env.NODE_ENV === 'development' ? 20 : 1

scheduleCron(`*/${duration} * * * * *`, async () => {
    console.log('------ FETCHING SAFES ------')
    const safes = (await getAllSafe()) || []
    console.log('------ FETCHED SAFES ------')

    safes.map(async (safe) => {
        pushToQueue(QUEUES.FETCH_SAFE_PENDING, safe)
    })
})
