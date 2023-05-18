export type Safe = {
    address: string
    chainId: number
    status: 'ENABLED' | 'DISABLED' | 'PAUSED' | 'PENDING'
    trxn: string
}
