import cron from 'node-cron'

export default (
    schedule: string,
    handler: ((now: Date | 'manual' | 'init') => void) | string,
) => {
    return cron.schedule(schedule, handler)
}
